"use client"

import { useState, useEffect, useCallback } from "react"
import { Zap } from "lucide-react"
import ProductCard from "@/components/product-card"
import { useRouter } from "next/navigation"

interface FlashSaleProduct {
  _id: string
  name: string
  price: number
  discountPrice?: number
  image: string
  company: { _id: string; name: string; slug: string }
}

interface FlashSale {
  _id: string
  name: string
  discountPercent: number
  endsAt: string
  startsAt: string
  products: FlashSaleProduct[]
}

function useCountdown(endsAt: string) {
  const calc = useCallback(() => {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1_000)
    return { hours: h, minutes: m, seconds: s, expired: false }
  }, [endsAt])

  const [time, setTime] = useState(calc)

  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(t)
  }, [calc])

  return time
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col  items-center">
      <div
        className="w-20 h-14 rounded-xl flex items-center justify-center text-2xl font-black tabular-nums border-[#be0f0f]"
        style={{ backgroundColor: "#ea0e0e", color: "#fff" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-xs font-semibold mt-1 uppercase tracking-widest" style={{ color: "#6b7c70" }}>
        {label}
      </span>
    </div>
  )
}

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const { hours, minutes, seconds, expired } = useCountdown(endsAt)
  if (expired) return <p className="text-sm font-semibold text-red-500">Sale has ended</p>
  return (
    <div className="flex items-end gap-2">
      <TimeBlock value={hours} label="hrs" />
      <span className="text-2xl font-black mb-3 " style={{ color: "#1e3a28" }}>:</span>
      <TimeBlock value={minutes} label="min" />
      <span className="text-2xl font-black mb-3" style={{ color: "#1e3a28" }}>:</span>
      <TimeBlock value={seconds} label="sec" />
    </div>
  )
}

export default function FlashDeal({ sale }: { sale: FlashSale }) {
  const router = useRouter()

  // Apply discount to product prices
  const products = sale.products.map((p) => ({
    ...p,
    discountPrice: Math.round(p.price - (p.price * sale.discountPercent) / 100),
  }))

  return (
    <section className="py-12 md:py-16 " style={{ backgroundColor: "#FAFAF8" }}>
      <div className="container-nezal py-8 px-7 rounded-xl border-[#dd1414] shadow-sm hover:shadow-xl md:shadow-md shadow-[#ed8181]">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2">
            {/* Live badge */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: "#e53e3e" }}>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Live Now
              </span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ backgroundColor: "#e8f5e8", color: "#1e6636" }}>
                {sale.discountPercent}% OFF
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Zap className="w-7 h-7 text-amber-500 fill-amber-400" />
              <div>
                <h2 className="text-[28px] md:text-[32px] font-black leading-tight"
                  style={{ color: "#1e3a28" }}>
                  {sale.name}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#6b7c70" }}>
                  {products.length} product{products.length !== 1 ? "s" : ""} on sale — grab them before time runs out!
                </p>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#6b7c70" }}>
              Sale ends in
            </p>
            <CountdownTimer endsAt={sale.endsAt} />
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <div key={product._id} className="relative">
              {/* Discount badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "#e53e3e" }}>
                -{sale.discountPercent}%
              </div>
              <ProductCard
                id={product._id}
                name={product.name}
                price={product.price}
                discountPrice={product.discountPrice}
                image={product.image}
                company={product.company}
                size="sm"
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => router.push("/shop")}
            className="group inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 font-semibold text-sm transition-all duration-200 hover:text-white"
            style={{
              borderColor: "var(--color-brand-primary)",
              color: "var(--color-brand-primary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-brand-primary)"
              e.currentTarget.style.color = "#fff"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "var(--color-brand-primary)"
            }}
          >
            Shop All Products
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

      </div>
    </section>
  )
}