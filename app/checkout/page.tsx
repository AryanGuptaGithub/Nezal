// app/checkout/page.tsx
"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/store/cart-store"
import { CheckoutForm } from "@/components/checkout-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trackInitiateCheckout } from "@/lib/facebook-pixel"
import { Zap } from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentSettings {
  enableCOD: boolean
  enableRazorpay: boolean
  enableCCAvenue?: boolean
}

// ===== Loader components (unchanged) =====
function TopProgressBar({ visible }: { visible: boolean }) {
  return (
    <div className={`fixed top-0 left-0 right-0 h-1 z-50 ${visible ? "block" : "hidden"}`}>
      <div className="h-1 bg-gradient-to-r from-transparent via-[--color-brand-primary]/80 to-transparent animate-[progress_2s_linear_infinite]" />
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

function FullPageLoader({ message = "Processing your request..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white shadow-2xl rounded-2xl p-6 flex items-center gap-4">
        <svg className="w-10 h-10 animate-spin text-[--color-brand-primary]" viewBox="0 0 50 50" aria-hidden>
          <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" strokeOpacity="0.15" stroke="currentColor" />
          <path d="M45 25a20 20 0 00-20-20" fill="none" strokeWidth="5" strokeLinecap="round" stroke="currentColor" />
        </svg>
        <div>
          <p className="font-medium text-sm text-[--color-text-heading]">{message}</p>
          <p className="text-xs text-[--color-text-muted]">Please don't close or reload the page.</p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[--color-bg-page] flex items-center justify-center">
        <div className="text-lg text-[--color-text-muted] flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[--color-text-muted] border-t-[--color-brand-primary] rounded-full animate-spin" />
          Loading checkout...
        </div>
      </main>
    }>
      <CheckoutPageInner />
    </Suspense>
  )
}

function CheckoutPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [shippingRate, setShippingRate] = useState<number | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)

  const [couponCode, setCouponCode] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [couponData, setCouponData] = useState<{
    code: string
    discountType: "percentage" | "flat"
    discountValue: number
    discountAmount: number
  } | null>(null)

  useEffect(() => {
    if (items.length > 0) {
      const productIds = items.map(item => item.productId)
      trackInitiateCheckout(getTotalPrice(), items.length, productIds)
    }
  }, [])

  // Surface CCAvenue failure/cancel redirects (?error=...) as a visible message
  useEffect(() => {
    const error = searchParams?.get("error")
    if (error) {
      setCheckoutError(decodeURIComponent(error.replace(/_/g, " ")))
    }
  }, [searchParams])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?redirect=/checkout")
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsRes = await fetch("/api/admin/payment-settings")
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setPaymentSettings(data)
        } else {
          setPaymentSettings({ enableCOD: true, enableRazorpay: false, enableCCAvenue: true })
        }

        const profileRes = await fetch("/api/users/profile")
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setUserData(profileData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setPaymentSettings({ enableCOD: true, enableRazorpay: false, enableCCAvenue: true })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {}
    }
  }, [])

  const fetchShippingRate = async (pincode: string) => {
    if (items.length === 0) return
    setShippingLoading(true)
    setShippingError(null)
    try {
      const res = await fetch("/api/shipping-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!data.serviceable) {
        setShippingRate(null)
        setShippingError(data.error || "This pincode isn't serviceable.")
      } else {
        setShippingRate(data.rate)
      }
    } catch {
      setShippingError("Couldn't fetch shipping rate.")
    } finally {
      setShippingLoading(false)
    }
  }

  const totalPrice = getTotalPrice()

  const flashSavings = items.reduce((sum, item) => {
    if (!item.flashSale || !item.discountPrice) return sum
    return sum + (item.price - item.discountPrice) * item.quantity
  }, 0)

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) { setCouponError("Enter a coupon code."); return }
    setCouponLoading(true); setCouponError("")
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotal: totalPrice }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Invalid coupon.")
        setCouponData(null)
        return
      }
      setCouponData({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
      })
      setCouponCode(data.code)
      setCouponError("")
    } catch {
      setCouponError("Could not validate coupon. Try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponData(null)
    setCouponCode("")
    setCouponInput("")
    setCouponError("")
  }

  const discountAmount = couponData?.discountAmount ?? 0
  const shippingCharge = shippingRate ?? 0
  const finalTotal = Math.max(0, totalPrice - discountAmount) + shippingCharge

  const handleCheckout = async (shippingAddress: any, paymentMethod: string) => {
    setIsLoading(true)
    setCheckoutError(null)

    try {
      if (paymentMethod === "cod") {
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              product: item.productId,
              quantity: item.quantity,
              price: item.discountPrice || item.price,
              selectedSize: item.selectedSize,
            })),
            shippingAddress,
            totalAmount: finalTotal,
            shippingAmount: shippingCharge,
            couponCode: couponCode || undefined,
            paymentMethod: "cod",
            paymentStatus: "pending",
          }),
        })

        const orderData = await orderResponse.json()
        if (!orderResponse.ok) throw new Error(orderData.error)

        clearCart()
        setIsLoading(false)
        router.push(`/order-success/${orderData.orderId}`)
        return
      }

      if (paymentMethod === "ccavenue") {
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              product: item.productId,
              quantity: item.quantity,
              price: item.discountPrice || item.price,
              selectedSize: item.selectedSize,
            })),
            shippingAddress,
            totalAmount: finalTotal,
            shippingAmount: shippingCharge,
            couponCode: couponCode || undefined,
            paymentMethod: "ccavenue",
            paymentStatus: "pending",
          }),
        })

        const orderData = await orderResponse.json()
        if (!orderResponse.ok) throw new Error(orderData.error || "Failed to create order")

        const initiateResponse = await fetch("/api/ccavenue/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.orderId,
            amount: finalTotal,
            billingName: shippingAddress.name,
            billingEmail: shippingAddress.email || session?.user?.email,
            billingPhone: shippingAddress.phone,
            billingAddress: shippingAddress.street,
            billingCity: shippingAddress.city,
            billingState: shippingAddress.state,
            billingZip: shippingAddress.zipCode,
            billingCountry: shippingAddress.country,
          }),
        })

        const initiateData = await initiateResponse.json()
        if (!initiateResponse.ok) throw new Error(initiateData.error || "Failed to initiate payment")

        clearCart()

        const form = document.createElement("form")
        form.method = "POST"
        form.action = initiateData.actionUrl

        const encRequestInput = document.createElement("input")
        encRequestInput.type = "hidden"
        encRequestInput.name = "encRequest"
        encRequestInput.value = initiateData.encRequest
        form.appendChild(encRequestInput)

        const accessCodeInput = document.createElement("input")
        accessCodeInput.type = "hidden"
        accessCodeInput.name = "access_code"
        accessCodeInput.value = initiateData.accessCode
        form.appendChild(accessCodeInput)

        document.body.appendChild(form)
        form.submit()
        return
      }

      if (paymentMethod === "razorpay") {
        const razorpayResponse = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalTotal }),
        })

        const razorpayOrder = await razorpayResponse.json()
        if (!razorpayResponse.ok) throw new Error(razorpayOrder.error || "Failed to create Razorpay order")

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Nezal",
          description: "Premium Skincare Products",
          handler: async (response: any) => {
            try {
              const verifyResponse = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  items: items.map((item) => ({
                    product: item.productId,
                    quantity: item.quantity,
                    price: item.discountPrice || item.price,
                    selectedSize: item.selectedSize,
                  })),
                  shippingAddress,
                  totalAmount: finalTotal,
                  shippingAmount: shippingCharge,
                  couponCode: couponCode || undefined,
                }),
              })

              const verifyData = await verifyResponse.json()
              if (verifyResponse.ok && verifyData.orderId) {
                clearCart()
                setIsLoading(false)
                router.push(`/order-success/${verifyData.orderId}`)
              } else {
                setIsLoading(false)
                alert("Payment verification failed. Please contact support.")
              }
            } catch (error) {
              console.error("Payment verification error:", error)
              setIsLoading(false)
              alert("Payment verification failed. Please try again.")
            }
          },
          modal: {
            ondismiss: () => {
              alert("Payment cancelled. Your order was not created.")
              setIsLoading(false)
            },
          },
          prefill: {
            email: session?.user?.email || shippingAddress?.email,
            name: session?.user?.name || shippingAddress?.name,
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert(`Checkout failed: ${error instanceof Error ? error.message : "Please try again."}`)
      setIsLoading(false)
    }
  }

  const getAvailablePaymentMethods = (): string[] => {
    if (!paymentSettings) return ["ccavenue", "cod"]
    const methods: string[] = []
    if (paymentSettings.enableCCAvenue) methods.push("ccavenue")
    if (paymentSettings.enableRazorpay) methods.push("razorpay")
    if (paymentSettings.enableCOD) methods.push("cod")
    return methods.length > 0 ? methods : ["ccavenue"]
  }

  // ===== Loading states =====
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[--color-bg-page] flex items-center justify-center">
        <div className="text-lg text-[--color-text-muted] flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[--color-text-muted] border-t-[--color-brand-primary] rounded-full animate-spin" />
          Loading checkout...
        </div>
      </main>
    )
  }

  const availablePaymentMethods = getAvailablePaymentMethods()

  return (
    <main className="min-h-screen bg-[--color-bg-page]">
      <TopProgressBar visible={isLoading} />

      <div className="container-nezal py-10">
        <h1 className="text-4xl font-bold text-[--color-text-heading] mb-8">Checkout</h1>

        {checkoutError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Payment was not completed: {checkoutError}. Please try again.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form – 2/3 */}
          <div className="lg:col-span-2">
            <CheckoutForm
              totalAmount={finalTotal}
              onSubmit={handleCheckout}
              onZipCodeChange={fetchShippingRate}
              availablePaymentMethods={availablePaymentMethods}
              initialData={{
                name: userData?.name || session?.user?.name || "",
                email: userData?.email || session?.user?.email || "",
                phone: userData?.phone || "",
                street: userData?.address || "",
                city: userData?.city || "",
                state: userData?.state || "",
                zipCode: userData?.pincode || "",
                country: "India",
              }}
              isSubmitting={isLoading}
            />
          </div>

          {/* Order Summary – 1/3 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 border border-[--color-border] rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-[--color-text-heading]">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Items */}
                {items.map((item) => (
                  <div key={item.productId} className="text-sm border-b border-[--color-border] pb-3 last:border-b-0">
                    <div className="flex justify-between">
                      <span className="text-[--color-text-body]">{item.name} x {item.quantity}</span>
                      <span className="font-semibold text-[--color-text-heading]">
                        ₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.selectedSize && (
                      <div className="text-xs text-[--color-text-muted] mt-1">
                        Size: {item.selectedSize.size} ({item.selectedSize.quantity}{item.selectedSize.unit})
                      </div>
                    )}
                    {item.ritual && (
                      <div className="inline-flex items-center gap-1 border text-[10px] bg-[#074d09] text-white font-semibold px-2 py-0.5 rounded-full mt-1.5">
                        ✨ {item.ritual.name}
                      </div>
                    )}
                    {item.flashSale && item.discountPrice && (
                      <div
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5"
                        style={{ backgroundColor: "#E4432B", color: "#ffffff" }}
                      >
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        {item.flashSale.discountPercent}% Flash Sale
                      </div>
                    )}
                  </div>
                ))}

                {/* Coupon input */}
                <div className="border-t border-[--color-border] pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[--color-text-muted] mb-2">
                    Coupon Code
                  </p>

                  {couponData ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-sm font-bold text-green-700 font-mono">{couponData.code}</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          {couponData.discountType === "percentage"
                            ? `${couponData.discountValue}% off applied`
                            : `₹${couponData.discountValue} off applied`}
                        </p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError("") }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon() } }}
                          placeholder="Enter code e.g. NEZAL25"
                          className="flex-1 h-10 px-3 text-sm font-mono uppercase rounded-xl border border-[--color-border] focus:outline-none focus:border-[--color-brand-primary] transition-colors bg-white"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponInput.trim()}
                          className="px-4 h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                          style={{ backgroundColor: "var(--color-brand-primary)" }}
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>✕</span> {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="border-t border-[--color-border] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[--color-text-muted]">Subtotal</span>
                    <span className="font-semibold text-[--color-text-heading]">₹{totalPrice.toFixed(2)}</span>
                  </div>

                  {flashSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1" style={{ color: "#E4432B" }}>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Flash Sale Savings
                      </span>
                      <span className="font-semibold" style={{ color: "#E4432B" }}>
                        − ₹{flashSavings.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {couponData && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">
                        Coupon ({couponData.code})
                      </span>
                      <span className="font-semibold text-green-600">
                        −₹{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-[--color-text-muted]">Shipping</span>
                    {shippingLoading ? (
                      <span className="text-xs text-[--color-text-muted]">Calculating…</span>
                    ) : shippingRate !== null ? (
                      <span className="font-semibold text-[--color-text-heading]">₹{shippingRate.toFixed(2)}</span>
                    ) : (
                      <span className="text-xs text-[--color-text-muted]">Enter pincode to calculate</span>
                    )}
                  </div>
                  {shippingError && <p className="text-xs text-red-500 mt-1">{shippingError}</p>}
                </div>

                {/* Final total */}
                <div className="border-t border-[--color-border] pt-4 flex justify-between text-lg font-bold">
                  <span className="text-[--color-text-heading]">Total</span>
                  <div className="text-right">
                    {couponData && (
                      <p className="text-sm line-through text-[--color-text-muted] font-normal">
                        ₹{totalPrice.toFixed(2)}
                      </p>
                    )}
                    <span className="text-[--color-text-heading]">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {isLoading && <FullPageLoader message="Redirecting to payment..." />}
    </main>
  )
}