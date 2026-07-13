// app/admin/orders/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, MapPin, CreditCard, Package, Truck, ExternalLink } from "lucide-react"
import { Search } from "lucide-react"

interface OrderItem {
  product?: {
    _id?: string
    name?: string
    sizes?: Array<{
      size: string
      unit: string
      quantity: number
      price: number
      discountPrice?: number
    }>
  }
  productId?: string
  productName?: string
  quantity?: number
  price?: number
  gstPercent?: number       // ← add
  taxableValue?: number     // ← add
  gstAmount?: number        // ← add
  selectedSize?: {
    size: string
    unit: string
    quantity: number
    price: number
    discountPrice?: number
  }
}

interface ShippingAddress {
  name?: string
  phone?: string
  street?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  zipCode?: string
  country?: string
}

interface Order {
  _id: string
  orderNumber?: string
  user?: { _id?: string; name?: string; email?: string; phone?: string }
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  items: OrderItem[]
  shippingAddress?: ShippingAddress
  totalAmount: number
  shippingAmount?: number        // ← add
  totalTaxableValue?: number     // ← add
  totalGstAmount?: number        // ← add
  paymentStatus?: string
  paymentMethod?: string
  orderStatus?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt?: string
  shiprocketOrderId?: number
  shiprocketShipmentId?: number
  awbCode?: string
  courierName?: string
  trackingUrl?: string
  shippingStatus?: string
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [shipError, setShipError] = useState<Record<string, string>>({})
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!session) {
      router.push("/auth/login")
      return
    }

    if ((session.user as any)?.role !== "admin") {
      router.push("/")
      return
    }

    fetchOrders()
  }, [session, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders")
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : data.orders || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update order")
      await fetchOrders()

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus })
      }
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update payment status")
      await fetchOrders()

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus })
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleShipOrder = async (orderId: string) => {
    setShippingId(orderId)
    setShipError((prev) => ({ ...prev, [orderId]: "" }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Shipment creation failed")

      await fetchOrders()

      // If modal is open for this order, refresh it too
      if (selectedOrder && selectedOrder._id === orderId) {
        const updated = orders.find((o) => o._id === orderId)
        if (updated) setSelectedOrder({ ...updated, ...data })
      }
    } catch (err: any) {
      setShipError((prev) => ({ ...prev, [orderId]: err.message }))
    } finally {
      setShippingId(null)
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  const filteredOrders = orders.filter((order) => {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true

  const orderId = (order.orderNumber || order._id).toLowerCase()
  const customerName = (order.user?.name || order.guestName || "").toLowerCase()
  const customerEmail = (order.user?.email || order.guestEmail || "").toLowerCase()

  return (
    orderId.includes(query) ||
    customerName.includes(query) ||
    customerEmail.includes(query)
  )
})

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading orders...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Orders Management</h1>

        <Card>
          <CardHeader className="flex flex-col items-start gap-1">
  <CardTitle className="">All Orders ({searchQuery ? filteredOrders.length : orders.length})</CardTitle>
  <div className="relative mt-3 max-w-lg ">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search by order ID or customer name..."
      className="w-full  h-9 pl-9 pr-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
    />
  </div>
</CardHeader>
          <CardContent>
            {orders.length === 0 ? (
  <div className="text-center py-8 text-muted-foreground">No orders found</div>
) : filteredOrders.length === 0 ? (
  <div className="text-center py-8 text-muted-foreground">
    No orders match "{searchQuery}"
  </div>
) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold">Items</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Payment</th>
                      <th className="text-left py-3 px-4 font-semibold">Method</th>
                      <th className="text-left py-3 px-4 font-semibold">GST</th>
                      <th className="text-left py-3 px-4 font-semibold">Shipping</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                   {filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs font-semibold">
                          {order.orderNumber || order._id.slice(-6)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{order.user?.name || order.guestName || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">{order.user?.email || order.guestEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <Badge variant="outline">{order.items?.length || 0} items</Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold">₹{(order.totalAmount || 0).toFixed(2)}</td>
                       <td className="py-3 px-4">
  <Badge
    className={
      order.paymentStatus === "completed"
        ? "bg-green-100 text-green-800 border-green-200"
        : order.paymentStatus === "failed"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-amber-100 text-amber-800 border-amber-200"
    }
  >
    {order.paymentStatus === "completed"
      ? "Completed"
      : order.paymentStatus === "failed"
      ? "Failed"
      : "Pending"}
  </Badge>
</td>
                        <td className="py-3 px-4">
  <Badge
    variant={
      order.paymentMethod === "cod"
        ? "secondary"
        : order.paymentMethod === "ccavenue"
        ? "outline"
        : "default"
    }
  >
    {order.paymentMethod === "cod"
      ? "COD"
      : order.paymentMethod === "ccavenue"
      ? "CCAvenue"
      : "Razorpay"}
  </Badge>
</td>
                     <td className="py-3 px-4 text-xs text-muted-foreground">
  ₹{(order.totalGstAmount ?? 0).toFixed(2)}
</td>

                        {/* Shiprocket column */}
                        <td className="py-3 px-4">
  {order.shiprocketOrderId ? (
    <div className="space-y-1">
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        Shipped
      </Badge>
      {order.awbCode && (
        <p className="text-xs text-muted-foreground font-mono">
          AWB: {order.awbCode}
        </p>
      )}
      {order.trackingUrl && (
        <a
          href={order.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Track <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  ) : order.paymentStatus === "completed" || order.paymentMethod === "cod" ? (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Processing…
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Awaiting payment
    </Badge>
  )}
</td>

                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder.orderNumber || selectedOrder._id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedOrder.user?.name || selectedOrder.guestName || "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOrder.user?.email || selectedOrder.guestEmail || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedOrder.user?.phone || selectedOrder.guestPhone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-3">
                 {(selectedOrder.items || []).map((item, idx) => (
  <div key={idx} className="bg-background p-3 rounded border border-border">
    <p className="font-medium">{item.productName || item.product?.name || `Item ${idx + 1}`}</p>
    {(() => {
      const sel = item.selectedSize ?? item.product?.sizes?.[0];
      if (!sel) return null;
      return (
        <p className="text-xs text-muted-foreground mt-1">
          Size: {sel.size} ({sel.quantity}{sel.unit})
        </p>
      );
    })()}
    <div className="flex justify-between text-sm mt-2">
      <span className="text-muted-foreground">
        Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}
      </span>
      <span className="font-medium">₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</span>
    </div>
    {typeof item.gstPercent === "number" && item.gstPercent > 0 && (
      <div className="flex justify-between text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
        <span>Taxable: ₹{(item.taxableValue ?? 0).toFixed(2)} + GST {item.gstPercent}%</span>
        <span>GST: ₹{(item.gstAmount ?? 0).toFixed(2)}</span>
      </div>
    )}
  </div>
))}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {Array.from(
                          new Set(
                            [
                              selectedOrder.shippingAddress.street,
                              selectedOrder.shippingAddress.address,
                            ].filter(Boolean)
                          )
                        ).join(", ") || "N/A"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">City</p>
                        <p className="font-medium">{selectedOrder.shippingAddress.city || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">State</p>
                        <p className="font-medium">{selectedOrder.shippingAddress.state || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">PIN Code</p>
                        <p className="font-medium">{selectedOrder.shippingAddress.pincode || selectedOrder.shippingAddress.zipCode || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

             <div className="bg-muted/50 p-4 rounded-lg">
  <h3 className="font-semibold mb-3 flex items-center gap-2">
    <CreditCard className="w-4 h-4" />
    Payment Information
  </h3>

  {/* Price breakdown */}
  <div className="space-y-1.5 text-sm mb-4 pb-4 border-b border-border">
    <div className="flex justify-between text-muted-foreground">
      <span>Taxable Value</span>
      <span>₹{(selectedOrder.totalTaxableValue ?? 0).toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-muted-foreground">
      <span>GST</span>
      <span>₹{(selectedOrder.totalGstAmount ?? 0).toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-muted-foreground">
      <span>Shipping</span>
      <span>₹{(selectedOrder.shippingAmount ?? 0).toFixed(2)}</span>
    </div>
    <div className="flex justify-between font-semibold text-foreground pt-1.5 border-t border-border">
      <span>Total</span>
      <span>₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-xs text-muted-foreground">Payment Method</p>
      <p className="font-medium">
        {selectedOrder.paymentMethod === "cod"
          ? "Cash on Delivery"
          : selectedOrder.paymentMethod === "ccavenue"
          ? "CCAvenue"
          : "Razorpay"}
      </p>
    </div>
    <div>
      <p className="text-xs text-muted-foreground">Payment Status</p>
      <Badge variant="outline">{selectedOrder.paymentStatus || "pending"}</Badge>
    </div>
    <div>
      <p className="text-xs text-muted-foreground">Order Status</p>
      <Badge variant="outline">{selectedOrder.orderStatus || "pending"}</Badge>
    </div>
  </div>
</div>

              {/* Shiprocket / Shipping Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Shiprocket
                </h3>
                {selectedOrder.shiprocketOrderId ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Shiprocket Order ID</p>
                      <p className="font-medium font-mono">{selectedOrder.shiprocketOrderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Shipment ID</p>
                      <p className="font-medium font-mono">{selectedOrder.shiprocketShipmentId}</p>
                    </div>
                    {selectedOrder.awbCode && (
                      <div>
                        <p className="text-xs text-muted-foreground">AWB Code</p>
                        <p className="font-medium font-mono">{selectedOrder.awbCode}</p>
                      </div>
                    )}
                    {selectedOrder.courierName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Courier</p>
                        <p className="font-medium">{selectedOrder.courierName}</p>
                      </div>
                    )}
                    {selectedOrder.trackingUrl && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Tracking</p>
                        <a
                          href={selectedOrder.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        >
                          Track Shipment <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
  <p className="text-sm text-muted-foreground">
    Shipment will be created automatically once payment is confirmed.
  </p>
)}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}