import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/lib/db"
import { Order } from "@/lib/models/order"
import { cancelShiprocketOrder } from "@/lib/shiprocket"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { action, adminNote } = await req.json() // "approve" | "reject" | "complete"

  await connectDB()
  const order = await Order.findById(id)
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (!order.cancellation || order.cancellation.status === "none") {
    return NextResponse.json({ error: "No request on this order" }, { status: 400 })
  }

  if (action === "approve") {
    order.cancellation.status = "approved"
    order.cancellation.processedAt = new Date()
    order.cancellation.adminNote = adminNote || null
    // Reverse pickup for shipped returns: arrange manually via Shiprocket dashboard,
    // then hit "complete" below once the item is back and refunded.
  } else if (action === "reject") {
    order.cancellation.status = "rejected"
    order.cancellation.processedAt = new Date()
    order.cancellation.adminNote = adminNote || null
  } else if (action === "complete") {
    if (order.shiprocketOrderId) {
      try {
        await cancelShiprocketOrder(order.shiprocketOrderId)
      } catch (err) {
        console.error(`Shiprocket cancel failed while completing return for order ${order._id}:`, err)
      }
    }
    order.cancellation.status = "completed"
    order.cancellation.processedAt = new Date()
    order.cancellation.adminNote = adminNote || order.cancellation.adminNote
    order.orderStatus = "cancelled"
    order.shippingStatus = "cancelled"
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  await order.save()
  return NextResponse.json({ success: true, order })
}