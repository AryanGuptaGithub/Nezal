// lib/models/order.ts
import mongoose from "mongoose";

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
      required: false, // ← was required: true — guest orders have no User
    },

    // NEW: guest contact info, used when `user` is absent
    guestEmail: String,
    guestName: String,
    guestPhone: String,

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
        selectedSize: {
          size: String,
          unit: {
            type: String,
            enum: ["ml", "l", "g", "kg"],
          },
          quantity: Number,
          price: Number,
          discountPrice: Number,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      zipCode: String,
      country: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay"],
      default: "razorpay",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);