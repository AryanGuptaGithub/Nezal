import { NextRequest, NextResponse } from "next/server";
import { getShippingRate } from "@/lib/shiprocket";
import { Product } from "@/lib/models/product";
import { connectDB } from "@/lib/db";

// Shiprocket charges these on top of the quoted courier rate at actual
// shipment-booking time — the /courier/serviceability quote API used below
// does NOT include them, so we add them back in here to avoid under-charging
// customers for shipping.
const SMART_ORDER_FEE = 5;      // Notify → WhatsApp Communication, flat per shipment (confirmed in Shiprocket settings)
const RATE_DRIFT_BUFFER = 3;    // covers Shiprocket picking a "Recommended" courier instead of the cheapest one we quoted
const SHIPPING_BUFFER = SMART_ORDER_FEE + RATE_DRIFT_BUFFER; // ₹8 total

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pincode, items, cod } = body;

    if (!pincode || !/^\d{6}$/.test(String(pincode))) {
      return NextResponse.json({ error: "Valid 6-digit pincode required" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    await connectDB();

    const productIds = items.map((i: any) => i.productId);
const products = await Product.find({ _id: { $in: productIds } })
  .select("weight length breadth height"); // ← add dimension fields

const dimensionMap = new Map(
  products.map((p: any) => [
    p._id.toString(),
    { length: p.length ?? 10, breadth: p.breadth ?? 10, height: p.height ?? 10 },
  ])
);
const weightMap = new Map(products.map((p: any) => [p._id.toString(), p.weight ?? 0.3]));

const totalWeight = items.reduce((sum: number, i: any) => {
  const w = weightMap.get(i.productId) ?? 0.3;
  return sum + w * (i.quantity ?? 1);
}, 0);

// Same heuristic as the order-creation side, so the quote matches reality
const boxLength = Math.max(
  ...items.map((i: any) => dimensionMap.get(i.productId)?.length ?? 10)
);
const boxBreadth = Math.max(
  ...items.map((i: any) => dimensionMap.get(i.productId)?.breadth ?? 10)
);
const boxHeight = items.reduce((sum: number, i: any) => {
  const h = dimensionMap.get(i.productId)?.height ?? 10;
  return sum + h * (i.quantity ?? 1);
}, 0);

    const { cheapest, options } = await getShippingRate({
      deliveryPincode: String(pincode),
      weight: Math.max(totalWeight, 0.1),
      cod: !!cod,
       length: boxLength,     // ← new
      breadth: boxBreadth,   // ← new
      height: boxHeight,     // ← new
    });

    if (!cheapest) {
      return NextResponse.json({ serviceable: false, error: "Not serviceable to this pincode" });
    }

    return NextResponse.json({
  serviceable: true,
  rate: cheapest.rate + SHIPPING_BUFFER,      // final padded number, unchanged for checkout UI
  breakdown: {
    baseCourierRate: cheapest.rate,
    smartOrderFee: SMART_ORDER_FEE,
    rateDriftBuffer: RATE_DRIFT_BUFFER,
    courierNameQuoted: cheapest.courierName,
  },
  freightCharge: cheapest.freightCharge,
  codCharge: cheapest.codCharge,
  courierName: cheapest.courierName,
  etd: cheapest.etd,
  weight: totalWeight,
  options,
});

  } catch (err: any) {
    console.error("Shipping rate error:", err.message);
    return NextResponse.json({ error: err.message ?? "Failed to fetch shipping rate" }, { status: 500 });
  }
}