// lib/models/order.ts
import mongoose from "mongoose"

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    guestEmail: String,
    guestName:  String,
    guestPhone: String,

    items: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        price:    Number,
        gstPercent:   { type: Number, default: 0 },  
        taxableValue: { type: Number, default: 0 },  
        gstAmount:    { type: Number, default: 0 },  
        selectedSize: {
          size:         String,
          unit:         { type: String, enum: ["ml", "l", "g", "kg"] },
          quantity:     Number,
          price:        Number,
          discountPrice: Number,
        },
      },
    ],

    totalAmount: { type: Number, required: true },
    shippingAmount: { type: Number, default: 0 }, 
    codCharge: { type: Number, default: 0 },
    totalTaxableValue: { type: Number, default: 0 },  // ← add
    totalGstAmount:    { type: Number, default: 0 },  // ← add

    abandonedEmailSentAt: { type: Date, default: null },

    shippingAddress: {
      name:    String,
      phone:   String,
      address: String,
      street:  String,
      city:    String,
      state:   String,
      pincode: String,
      zipCode: String,
      country: String,
    },

    paymentStatus: {
      type:    String,
      enum:    ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type:    String,
      enum:    ["cod", "razorpay","ccavenue"],
      default: "razorpay",
    },
    ccavenueTrackingId: { type: String, default: null },
ccavenueBankRefNo: { type: String, default: null },
    orderStatus: {
      type:    String,
      enum:    ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    razorpayOrderId:  String,
    razorpayPaymentId: String,

    // ── Shiprocket fields (all optional) ──────────────────
    shiprocketOrderId:   { type: Number, default: null },
    shiprocketShipmentId: { type: Number, default: null },
    awbCode:             { type: String, default: null },
    courierName:         { type: String, default: null },
    trackingUrl:         { type: String, default: null },
    shippingStatus: {
      type: String,
      enum: [
        "not_shipped",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "rto_initiated",
        "rto_delivered",
        "cancelled",
      ],
      default: "not_shipped",
    },

    // ── Coupon ────────────────────────────────────────────
    couponCode:     { type: String, default: null },
    discountAmount: { type: Number, default: 0    },
    cancellation: {
  status: {
    type: String,
    enum: ["none", "requested", "approved", "rejected", "completed"],
    default: "none",
  },
  type: { type: String, enum: ["cancel", "return", null], default: null },
  reason: { type: String, default: null },
  note: { type: String, default: null },
  requestedAt: { type: Date, default: null },
  processedAt: { type: Date, default: null },
  adminNote: { type: String, default: null },
},
  },
  { timestamps: true }   // ← second argument to mongoose.Schema, not a field

)


const Order = mongoose.models.Order as mongoose.Model<typeof orderSchema> ||
  mongoose.model("Order", orderSchema);

export { Order };