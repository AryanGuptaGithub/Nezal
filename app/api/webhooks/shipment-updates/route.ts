// app/api/webhooks/shipment-updates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/order";

/**
 * Shiprocket sends webhook POST requests whenever a shipment status changes.
 * Docs: https://apidocs.shiprocket.in/#webhooks
 *
 * Setup (do this in Shiprocket dashboard):
 *   Settings → API → Configure → Webhooks
 *   URL: https://yourdomain.com/api/webhooks/shiprocket
 *   Add a custom header: X-Api-Key: <your SHIPROCKET_WEBHOOK_SECRET>
 *   (Shiprocket lets you set a custom token that they'll echo back in headers,
 *    OR sends the API secret you configured — verify exact field name once
 *    you reach the Webhooks config screen, as Shiprocket's UI varies.)
 *
 * Shiprocket webhook payload shape (typical):
 * {
 *   "awb": "...",
 *   "courier_name": "...",
 *   "current_status": "...",
 *   "shipment_status": "...",  // numeric or string status code
 *   "order_id": "...",         // your order_id you sent at creation
 *   "sr_order_id": 123,        // shiprocket's internal id
 *   "etd": "...",
 *   ...
 * }
 */

// Map Shiprocket's status strings to your internal shippingStatus enum
const STATUS_MAP: Record<string, string> = {
  "NEW": "processing",
  "PICKUP SCHEDULED": "processing",
  "PICKED UP": "shipped",
  "IN TRANSIT": "shipped",
  "OUT FOR DELIVERY": "out_for_delivery",
  "DELIVERED": "delivered",
  "RTO INITIATED": "rto_initiated",
  "RTO DELIVERED": "rto_delivered",
  "CANCELLED": "cancelled",
  "CANCELED": "cancelled",
};

// When shippingStatus hits these, also update the order's main orderStatus
const ORDER_STATUS_SYNC: Record<string, string> = {
  shipped: "shipped",
  out_for_delivery: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

export async function POST(req: NextRequest) {
  // ─── Verify the request is really from Shiprocket ───────────────────────
  const incomingSecret =
    req.headers.get("x-api-key") ?? req.headers.get("x-webhook-secret");

  if (incomingSecret !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
    console.warn("Shiprocket webhook: invalid or missing secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("Shiprocket webhook received:", JSON.stringify(body));

  await connectDB();

  // Shiprocket sends order_id (the one we set at creation = our Mongo _id)
  const orderId = body.order_id;
  const awb = body.awb;
  const rawStatus =
    (body.current_status || body.shipment_status || "").toString().toUpperCase();

  if (!orderId && !awb) {
    return NextResponse.json(
      { error: "Missing order_id and awb in payload" },
      { status: 400 }
    );
  }

  // Find the order by our internal order_id first, fallback to AWB
  const order = orderId
    ? await Order.findById(orderId).catch(() => null)
    : await Order.findOne({ awbCode: awb });

  const resolvedOrder = order ?? (orderId ? null : await Order.findOne({ awbCode: awb }));

  if (!resolvedOrder) {
    console.warn(`Shiprocket webhook: order not found (order_id=${orderId}, awb=${awb})`);
    // Return 200 anyway — Shiprocket will retry on non-2xx and we don't want retry storms
    return NextResponse.json({ received: true, matched: false });
  }

  const mappedShippingStatus = STATUS_MAP[rawStatus] ?? null;

  const update: Record<string, any> = {};

  if (mappedShippingStatus) {
    update.shippingStatus = mappedShippingStatus;

    const syncedOrderStatus = ORDER_STATUS_SYNC[mappedShippingStatus];
    if (syncedOrderStatus) {
      update.orderStatus = syncedOrderStatus;
    }
  }

  if (awb && !resolvedOrder.awbCode) {
    update.awbCode = awb;
    update.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
  }

  if (body.courier_name && !resolvedOrder.courierName) {
    update.courierName = body.courier_name;
  }

  if (Object.keys(update).length > 0) {
    await Order.findByIdAndUpdate(resolvedOrder._id, update);
    console.log(
      `Order ${resolvedOrder._id} updated:`,
      JSON.stringify(update)
    );
  }

  return NextResponse.json({ received: true, matched: true });
}