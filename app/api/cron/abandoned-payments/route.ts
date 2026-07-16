import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Order } from "@/lib/models/order"
import { sendEmail, getAbandonedPaymentEmail } from "@/lib/email"

const ABANDONED_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || "+91 7710076400"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDB()

  const cutoff = new Date(Date.now() - ABANDONED_THRESHOLD_MS)

  const abandonedOrders = await Order.find({
    paymentMethod: "ccavenue",
    paymentStatus: "pending",
    abandonedEmailSentAt: null,
    createdAt: { $lte: cutoff },
  })

  let resolvedCount = 0
  let emailedCount = 0

  for (const order of abandonedOrders) {
    try {
      // Close the order out first — don't let a missing/failed email
      // block the status update from happening.
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "failed",
        orderStatus: "cancelled",
        abandonedEmailSentAt: new Date(),
      })
      resolvedCount++

      const recipientEmail = order.guestEmail || (order.shippingAddress as any)?.email
      const recipientName = order.guestName || order.shippingAddress?.name || "Customer"

      if (recipientEmail) {
        const html = getAbandonedPaymentEmail({
          customerName: recipientName,
          orderId: order.orderNumber,
          totalAmount: order.totalAmount,
          supportPhone: SUPPORT_PHONE,
        })

        const sent = await sendEmail({
          to: recipientEmail,
          subject: `You left something behind - Order ${order.orderNumber}`,
          html,
        })

        if (sent) emailedCount++
      }
    } catch (err) {
      console.error(`Failed to process abandoned order ${order._id}:`, err)
    }
  }

  return NextResponse.json({ checked: abandonedOrders.length, resolved: resolvedCount, emailed: emailedCount })
}