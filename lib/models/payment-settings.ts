import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema(
  {
    enableCOD: { 
      type: Boolean,
      default: true,
    },
    enableRazorpay: {
      type: Boolean,
      default: false, // disabled by default — kept available to re-enable later
    },
    enableCCAvenue: {
      type: Boolean,
      default: true,
    },
    minCODAmount: {
      type: Number,
      default: 0, // Minimum order amount for COD
    },
    maxCODAmount: {
      type: Number,
      default: 100000, // Maximum order amount for COD
    },
     // ── Free shipping ──────────────────────────────
    freeShippingEnabled: {
      type: Boolean,
      default: false,
    },
    freeShippingThreshold: {
      type: Number,
      default: 0, // order subtotal (after discount, before shipping) must be >= this
    },
  },
  { timestamps: true }
);

export const PaymentSettings =
  mongoose.models.PaymentSettings ||
  mongoose.model("PaymentSettings", paymentSettingsSchema);