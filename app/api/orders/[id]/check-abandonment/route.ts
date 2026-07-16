import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Order } from "@/lib/models/order"
import { sendEmail, getAbandonedPaymentEmail } from "@/lib/email"

const ABANDONED_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || "+91 7710076400"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const order = await Order.findById(params.id)

    if (!order || order.paymentMethod !== "ccavenue" || order.paymentStatus !== "pending") {
      // Resolved already (paid/failed), not found, or not a ccavenue order — nothing to do.
      return NextResponse.json({ stillPending: false })
    }

    const elapsed = Date.now() - new Date(order.createdAt).getTime()

    if (elapsed < ABANDONED_THRESHOLD_MS) {
      return NextResponse.json({
        stillPending: true,
        tooSoon: true,
        remainingMs: ABANDONED_THRESHOLD_MS - elapsed,
      })
    }

    // Threshold passed — close the order out now instead of waiting for the cron.
    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: "failed",
      orderStatus: "cancelled",
    })

    const recipientEmail = order.guestEmail || (order.shippingAddress as any)?.email
    const recipientName = order.guestName || order.shippingAddress?.name || "Customer"

    if (recipientEmail && !order.abandonedEmailSentAt) {
      try {
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

        if (sent) {
          await Order.findByIdAndUpdate(order._id, { abandonedEmailSentAt: new Date() })
        }
      } catch (emailErr) {
        // Order is already marked failed/cancelled above — an email hiccup
        // here shouldn't change the response the client gets.
        console.error(`Failed to send abandoned-payment email for order ${order._id}:`, emailErr)
      }
    }

    return NextResponse.json({ stillPending: false, marked: "failed" })
  } catch (err) {
    console.error("check-abandonment error:", err)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}