/**
 * lib/shiprocket.ts
 * Shiprocket API wrapper.
 * - Authenticates via email + password → bearer token
 * - Caches token in memory (valid ~10 days, we refresh after 9)
 * - Exposes createShiprocketOrder()
 */

const SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external";

interface TokenCache {
  token: string;
  fetchedAt: number; // ms timestamp
}

// Module-level cache — survives across requests in the same server process
let tokenCache: TokenCache | null = null;
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // 9 days in ms

async function getToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && now - tokenCache.fetchedAt < TOKEN_TTL_MS) {
    return tokenCache.token;
  }

  const res = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiprocket auth failed: ${err}`);
  }

  const data = await res.json();

  if (!data.token) {
    throw new Error("Shiprocket auth response missing token");
  }

  tokenCache = { token: data.token, fetchedAt: now };
  return data.token;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  weight: number; // kg
}

export interface ShiprocketAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CreateShiprocketOrderParams {
  orderId: string;          // your internal MongoDB order _id (used as order_id)
  orderDate: string;        // ISO date string e.g. "2026-06-29"
  items: ShiprocketOrderItem[];
  shipping: ShiprocketAddress;
  billing: ShiprocketAddress;
  paymentMethod: "COD" | "Prepaid";
  subTotal: number;
  totalDiscount?: number;
  shippingCharges?: number;
}

export interface ShiprocketOrderResult {
  shiprocketOrderId: number;
  shiprocketShipmentId: number;
  status: string;
  awbCode?: string;
  courierName?: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function createShiprocketOrder(
  params: CreateShiprocketOrderParams
): Promise<ShiprocketOrderResult> {
  const token = await getToken();

  const totalWeight = params.items.reduce(
    (sum, item) => sum + item.weight * item.units,
    0
  );

  const payload = {
    order_id: params.orderId,
    order_date: params.orderDate,
    pickup_location: "Nezal Mumbai Office", // must match exact nickname in Shiprocket dashboard

    channel_id: "",
    comment: "",

    billing_customer_name: params.billing.name,
    billing_last_name: "",
    billing_address: params.billing.address,
    billing_address_2: "",
    billing_city: params.billing.city,
    billing_pincode: params.billing.pincode,
    billing_state: params.billing.state,
    billing_country: params.billing.country,
    billing_email: params.billing.email,
    billing_phone: params.billing.phone,

    shipping_is_billing: false,
    shipping_customer_name: params.shipping.name,
    shipping_last_name: "",
    shipping_address: params.shipping.address,
    shipping_address_2: "",
    shipping_city: params.shipping.city,
    shipping_pincode: params.shipping.pincode,
    shipping_state: params.shipping.state,
    shipping_country: params.shipping.country,
    shipping_email: params.shipping.email,
    shipping_phone: params.shipping.phone,

    order_items: params.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.selling_price,
      discount: 0,
      tax: "",
      hsn: "",
    })),

    payment_method: params.paymentMethod,
    shipping_charges: params.shippingCharges ?? 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: params.totalDiscount ?? 0,
    sub_total: params.subTotal,

    length: 15,  // cm — default box size
    breadth: 10,
    height: 10,
    weight: parseFloat(totalWeight.toFixed(2)),
  };

  const res = await fetch(`${SHIPROCKET_API}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Shiprocket order creation failed: ${JSON.stringify(data)}`
    );
  }

  return {
    shiprocketOrderId: data.order_id,
    shiprocketShipmentId: data.shipment_id,
    status: data.status,
    awbCode: data.awb_code ?? undefined,
    courierName: data.courier_name ?? undefined,
  };
}