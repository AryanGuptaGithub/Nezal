"use client"
// app/rituals/[slug]/page.tsx
//
// Public ritual detail page — hero, ordered routine steps, and the
// curated product list for this ritual. Mirrors the structure of
// app/concerns/[slug]/page.tsx.

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { ChevronRight, Home, Sparkles } from "lucide-react"
import ProductCard from "@/components/product-card"
import { useCartStore } from "@/lib/store/cart-store"
import { useToast } from "@/hooks/use-toast"
import { ShoppingBag, Phone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface RitualStep {
  stepNumber: number
  title: string
  description: string
  productId?: { _id: string; name: string; slug: string; image?: string } | null
}

interface RitualProduct {
  _id: string
  name: string
  slug: string
  price: number
  discountPrice?: number
  image?: string
  images?: string[]
  variantLabel?: string
  skinTypes?: string[]
  concerns?: string[]
  keyIngredients?: { name: string; benefit: string }[]
  sizes?: any[]
  stock?: number
  company: { name: string; slug: string }
}

interface Ritual {
  _id: string
  name: string
  slug: string
  tagline: string
  description: string
  heroImage: string
  color: string
  steps: RitualStep[]
  idealFor: string[]
  products: RitualProduct[]
}

function RitualSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] animate-pulse">
      <div className="h-72 bg-neutral-100" />
      <div className="container-nezal py-12 flex flex-col gap-6">
        <div className="h-6 w-48 bg-neutral-100 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-neutral-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RitualPage() {
  const params = useParams()
  const slug = params.slug as string

  const [ritual, setRitual] = useState<Ritual | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

    const addItem = useCartStore((state) => state.addItem)
    const getTotalItems = useCartStore((state) => state.getTotalItems)
    const { toast } = useToast()
    const [showBulkOrderModal, setShowBulkOrderModal] = useState(false)
    const [addingRitual, setAddingRitual] = useState(false)


    function handleAddRitualToCart() {
  if (!ritual || ritual.products.length === 0) return

  const currentTotal = getTotalItems()
  const incoming = ritual.products.length

  // Same 5-item cap the rest of the site enforces. Adding a partial
  // ritual would be confusing, so we block the whole action and route
  // to the same bulk-order flow used elsewhere instead of silently
  // adding only some of the products.
  if (currentTotal + incoming > 5) {
    setShowBulkOrderModal(true)
    return
  }

  setAddingRitual(true)
  ritual.products.forEach((product) => {
    const hasSizes = !!product.sizes?.length
    // Products with size variants need one selected — default to the
    // cheapest option so "add all" never blocks on a missing choice.
    const cheapestSize = hasSizes
      ? [...product.sizes!].sort(
          (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
        )[0]
      : undefined

    addItem({
      productId: product._id,
      name: product.name,
      price: hasSizes ? cheapestSize!.price : product.price,
      discountPrice: hasSizes ? cheapestSize!.discountPrice : product.discountPrice,
      image: product.image || "",
      quantity: 1,
      company: product.company,
      selectedSize: cheapestSize as any,
      ritual: { slug: ritual.slug, name: ritual.name },
    })
  })

  setAddingRitual(false)
  toast({
    title: "Ritual added to cart",
    description: `All ${incoming} products from ${ritual.name} were added.`,
  })
}

  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/rituals/${slug}`)
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setRitual(data.ritual)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) return <RitualSkeleton />

  if (notFound || !ritual) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-page)] flex flex-col items-center justify-center gap-4 py-20">
        <Sparkles size={40} className="text-[var(--color-brand-primary)]/30" />
        <p className="text-[var(--color-text-muted)] text-lg">This ritual could not be found.</p>
        <Link href="/" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
          Back to home →
        </Link>
      </main>
    )
  }

  const sortedSteps = [...ritual.steps].sort((a, b) => a.stepNumber - b.stepNumber)

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">

      {/* ── Hero ── */}
      <section style={{ backgroundColor: ritual.color || "#F3F5EF" }} className="border-b border-[var(--color-border)]">
        <div className="container-nezal py-12 md:py-16">
          <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
            <Link href="/" className="hover:text-[var(--color-brand-primary)] flex items-center gap-1">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} />
            <span className="text-[var(--color-text-heading)] font-medium">Rituals</span>
            <ChevronRight size={13} />
            <span className="text-[var(--color-text-heading)] font-medium">{ritual.name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-sm font-medium">
                <Sparkles size={13} /> Ritual
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--color-text-heading)] leading-tight">
                {ritual.name}
              </h1>
              {ritual.tagline && (
                <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">{ritual.tagline}</p>
              )}
              {ritual.description && (
                <p className="text-sm text-[var(--color-text-body)] leading-relaxed max-w-xl">{ritual.description}</p>
              )}

              {ritual.idealFor?.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    Ideal For
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ritual.idealFor.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1 rounded-full bg-white/70 border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-heading)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {ritual.heroImage && (
              <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden">
                <Image src={ritual.heroImage} alt={ritual.name} fill className="object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Routine Steps ── */}
      {sortedSteps.length > 0 && (
        <section className="bg-white border-b border-[var(--color-border)]">
          <div className="container-nezal py-12">
            <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-8">
              Your Routine, Step by Step
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedSteps.map((step) => (
                <div key={step.stepNumber} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white font-bold text-sm">
                      {step.stepNumber}
                    </div>
                    <h3 className="font-bold text-[var(--color-text-heading)]">{step.title}</h3>
                  </div>
                  {step.description && (
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed pl-12">
                      {step.description}
                    </p>
                  )}
                  {step.productId && (
                    <Link
                      href={`/shop/${(step.productId as any).company?.slug || "shop"}/product/${step.productId._id}`}
                      className="pl-12 inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      View product →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    {/* ── Curated Products ── */}
<section className="container-nezal py-12">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <h2 className="text-xl font-bold text-[var(--color-text-heading)]">
      Shop The {ritual.name}
    </h2>
    {ritual.products.length > 0 && (
      <button
        onClick={handleAddRitualToCart}
        disabled={addingRitual}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#1e3a28" }}
      >
        <ShoppingBag className="h-4 w-4" />
        Add Full Ritual to Cart ({ritual.products.length} products)
      </button>
    )}
  </div>

  {ritual.products.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-[var(--color-text-muted)]">No products added to this ritual yet.</p>
      <Link href="/shop" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
        Browse all products →
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {ritual.products.map((product) => (
        <ProductCard
          key={product._id}
          id={product._id}
          name={product.name}
          slug={product.slug}
          price={product.price}
          discountPrice={product.discountPrice}
          image={product.image}
          images={product.images}
          variantLabel={product.variantLabel}
          skinTypes={product.skinTypes}
          concerns={product.concerns}
          keyIngredients={product.keyIngredients}
          company={product.company}
          hasMultipleSizes={!!product.sizes?.length}
          sizes={product.sizes as any}
          stock={product.stock}
        />
      ))}
    </div>
  )}
</section>

      <Dialog open={showBulkOrderModal} onOpenChange={setShowBulkOrderModal}>
  <DialogContent className="sm:max-w-[420px] rounded-2xl">
    <DialogHeader>
      <DialogTitle>This ritual is a bulk order</DialogTitle>
      <DialogDescription>
        Adding every product in this ritual would put you over the 5-item cart
        limit. For bulk orders, please contact our team directly.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-2 py-2">
      <a
        href="tel:+917710076400"
        className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <Phone className="w-4 h-4 text-primary" />
        <span className="text-primary font-semibold">+91 7710076400</span>
      </a>
    </div>
  </DialogContent>
</Dialog>

    </main>
  )
}