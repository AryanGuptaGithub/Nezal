// app/api/ccavenue/response/route.ts
/**
 * CCAvenue redirects the browser here (via POST) after payment, with an
 * `encResp` field containing the encrypted transaction result.
 *
 * This route:
 *   1. Decrypts encResp
 *   2. Verifies order_status
 *   3. Updates the Order in MongoDB (order was already created as "pending"
 *      by /api/orders before redirecting to CCAvenue)
 *   4. Sends confirmation emails on success
 *   5. Redirects the browser to /order-success/[id] or /checkout?error=...
 */

import { NextRequest, NextResponse } from "next/server";
import { decrypt, parseCCAvenueResponse } from "@/lib/ccavenue";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/order";
import { sendEmail, getOrderConfirmationEmail, getAdminOrderNotificationEmail } from "@/lib/email";
import "@/lib/models/product";

export async function POST(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const formData = await req.formData();
    const encResp = formData.get("encResp") as string | null;

    if (!encResp) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=missing_response`);
    }

    const decrypted = decrypt(encResp);
    const data = parseCCAvenueResponse(decrypted);

    console.log("CCAvenue response:", JSON.stringify(data));

    const {
      order_id, // OUR order id we sent at initiation
      order_status,
      tracking_id, // CCAvenue's transaction id
      bank_ref_no,
      failure_message,
    } = data;

    await connectDB();

    if (order_status === "Success") {
      const updatedOrder = await Order.findByIdAndUpdate(
        order_id,
        {
          paymentStatus: "completed",
          orderStatus: "processing",
          ccavenueTrackingId: tracking_id,
          ccavenueBankRefNo: bank_ref_no,
        },
        { new: true }
      );

      if (updatedOrder) {
        // Send confirmation emails, same pattern as COD path in /api/orders
        try {
          const populatedOrder = await Order.findById(updatedOrder._id)
            .populate("items.product")
            .lean();

          if (populatedOrder) {
            const recipientEmail =
              (populatedOrder as any).guestEmail ??
              (populatedOrder as any).shippingAddress?.email ??
              "";
            const recipientName =
              (populatedOrder as any).guestName ??
              (populatedOrder as any).shippingAddress?.name ??
              "Customer";

            const itemsData = (populatedOrder as any).items.map((item: any) => ({
              name: item.product?.name || "Product",
              quantity: item.quantity,
              price: item.price,
              selectedSize: item.selectedSize,
            }));

            const orderDate = new Date((populatedOrder as any).createdAt).toLocaleDateString(
              "en-IN",
              { year: "numeric", month: "long", day: "numeric" }
            );

            const confirmationEmailHtml = getOrderConfirmationEmail({
              orderId: (populatedOrder as any).orderNumber,
              customerName: recipientName,
              items: itemsData,
              total: (populatedOrder as any).totalAmount,
              orderDate,
            });

            if (recipientEmail) {
              await sendEmail({
                to: recipientEmail,
                subject: `Order Received - ${(populatedOrder as any).orderNumber}`,
                html: confirmationEmailHtml,
              });
            }

            const adminEmailHtml = getAdminOrderNotificationEmail({
              customerName: recipientName,
              customerEmail: recipientEmail,
              customerPhone: (populatedOrder as any).shippingAddress?.phone || "N/A",
              orderId: (populatedOrder as any).orderNumber,
              items: itemsData,
              totalAmount: (populatedOrder as any).totalAmount,
              paymentStatus: "completed",
              paymentMethod: "ccavenue",
              shippingAddress: (populatedOrder as any).shippingAddress,
              orderDate,
            });

            await sendEmail({
              to: process.env.GMAIL_EMAIL || "nezal@gmail.com",
              subject: `🚨 NEW ORDER - ${(populatedOrder as any).orderNumber}`,
              html: adminEmailHtml,
            });
          }
        } catch (emailError) {
          console.error("Failed to send CCAvenue order emails:", emailError);
        }
      }

      return NextResponse.redirect(`${siteUrl}/order-success/${order_id}`);
    } else {
      // Aborted, Failure, Invalid, etc.
      await Order.findByIdAndUpdate(order_id, {
        paymentStatus: "failed",
      }).catch(() => {});

      const reason = encodeURIComponent(failure_message || order_status || "payment_failed");
      return NextResponse.redirect(`${siteUrl}/checkout?error=${reason}`);
    }
  } catch (err: any) {
    console.error("CCAvenue response error:", err.message);
    return NextResponse.redirect(`${siteUrl}/checkout?error=processing_error`);
  }
}