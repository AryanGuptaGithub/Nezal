"use client"
// app/ingredients/[slug]/page.tsx
//
// Mirrors app/concerns/[slug]/page.tsx. Lists all products containing
// a given ingredient (matched by name, case-insensitive, partial match).
// Reached via the search bar's "Ingredients" results, or can be linked
// to directly as /ingredients/<slug> (e.g. /ingredients/tea-tree).

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, Leaf, Home } from "lucide-react"
import ProductCard from "@/components/product-card"

interface KeyIngredient {
  name: string
  benefit: string
}

interface Product {
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
  ingredients?: string[]
  keyIngredients?: KeyIngredient[]
  collectionSlug?: string
  sizes?: {
    size: string
    unit: string
    quantity: number
    price: number
    discountPrice?: number
    stock: number
  }[]
  stock?: number
  company: { name: string; slug: string }
}

function toLabel(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function IngredientSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] animate-pulse">
      <div className="h-48 bg-neutral-100" />
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

export default function IngredientPage() {
  const params = useParams()
  const slug = params.slug as string

  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const label = toLabel(slug)

  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/ingredients/${slug}`)
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setProducts(data.products ?? [])
        setSearchTerm(data.searchTerm ?? label)
        if ((data.products ?? []).length === 0) setNotFound(true)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) return <IngredientSkeleton />

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)]">

      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#F3F5EF" }} className="border-b border-[var(--color-border)]">
        <div className="container-nezal py-10 md:py-14">
          <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
            <Link href="/" className="hover:text-[var(--color-brand-primary)] flex items-center gap-1">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} />
            <span className="text-[var(--color-text-heading)] font-medium">Ingredient</span>
            <ChevronRight size={13} />
            <span className="text-[var(--color-text-heading)] font-medium">{label}</span>
          </nav>

          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-sm font-medium">
              <Leaf size={13} /> Ingredient
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-heading)] leading-tight">
              Products with {label}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {notFound
                ? `No products currently contain "${label}".`
                : `${products.length} product${products.length !== 1 ? "s" : ""} containing ${label}`}
            </p>
          </div>
        </div>
      </section>

      {/* ── Products ── */}
      <section className="container-nezal py-12">
        {notFound || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Leaf size={40} className="text-[var(--color-brand-primary)]/30" />
            <p className="text-[var(--color-text-muted)] text-lg">
              No products found with this ingredient yet.
            </p>
            <Link href="/shop" className="text-[var(--color-brand-primary)] font-semibold hover:underline">
              Browse all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
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