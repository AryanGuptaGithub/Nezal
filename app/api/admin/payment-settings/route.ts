import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PaymentSettings } from "@/lib/models/payment-settings";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";

const DEFAULT_SETTINGS = {
  enableCOD: true,
  enableRazorpay: false,
  enableCCAvenue: true,
  minCODAmount: 0,
  maxCODAmount: 100000,
  freeShippingEnabled: false,
  freeShippingThreshold: 0,
  codFeeEnabled: false,
  codFeeType: "flat",
  codFeeValue: 0,
  codFeeMin: 0,
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Atomic upsert — guarantees exactly one document ever exists,
    // no race between concurrent GET/PUT calls creating duplicates.
    const settings = await PaymentSettings.findOneAndUpdate(
      {},
      { $setOnInsert: DEFAULT_SETTINGS },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const {
      enableCOD, enableRazorpay, enableCCAvenue, minCODAmount, maxCODAmount,
      freeShippingEnabled, freeShippingThreshold,
      codFeeEnabled, codFeeType, codFeeValue, codFeeMin,
    } = await request.json();

    // Same atomic upsert pattern — updates the one true document,
    // creates it if it somehow doesn't exist yet, never creates a duplicate.
    const settings = await PaymentSettings.findOneAndUpdate(
      {},
      {
        $set: {
          enableCOD, enableRazorpay, enableCCAvenue, minCODAmount, maxCODAmount,
          freeShippingEnabled, freeShippingThreshold,
          codFeeEnabled, codFeeType, codFeeValue, codFeeMin,
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 }
    );
  }
}