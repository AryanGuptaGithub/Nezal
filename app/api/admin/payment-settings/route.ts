import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PaymentSettings } from "@/lib/models/payment-settings";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";

export async function GET(request: NextRequest) {
  try {
    // GET is intentionally public — checkout (including guests and
    // non-admin users) needs to read these settings to decide which
    // payment options to show. Only PUT (updating settings) is admin-gated.
    await connectDB();

    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = await PaymentSettings.create({
        enableCOD: true,
        enableRazorpay: false, // disabled by default, switched to CCAvenue
        enableCCAvenue: true,
        minCODAmount: 0,
        maxCODAmount: 100000,
      });
    }

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

    // ⚠️ SECURITY CHECK: Only admins can update payment settings
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const { enableCOD, enableRazorpay, enableCCAvenue, minCODAmount, maxCODAmount } =
      await request.json();

    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = await PaymentSettings.create({
        enableCOD,
        enableRazorpay,
        enableCCAvenue,
        minCODAmount,
        maxCODAmount,
      });
    } else {
      settings.enableCOD = enableCOD;
      settings.enableRazorpay = enableRazorpay;
      settings.enableCCAvenue = enableCCAvenue;
      settings.minCODAmount = minCODAmount;
      settings.maxCODAmount = maxCODAmount;
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 }
    );
  }
}