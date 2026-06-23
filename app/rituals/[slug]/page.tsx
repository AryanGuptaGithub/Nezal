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
        <h2 className="text-xl font-bold text-[var(--color-text-heading)] mb-6">
          Shop The {ritual.name}
        </h2>
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

    </main>
  )
}