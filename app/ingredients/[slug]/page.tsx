"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, Leaf, Home, CheckCircle2, Sparkles, FlaskConical } from "lucide-react"
import ProductCard from "@/components/product-card"
import Image from "next/image"

/* ─── Types ──────────────────────────────────────────────── */

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
  keyIngredients?: KeyIngredient[]
  sizes?: { size: string; unit: string; quantity: number; price: number; discountPrice?: number; stock: number }[]
  stock?: number
  company: { name: string; slug: string }
}

interface IngredientInfo {
  label: string
  tagline: string
  description: string
  category: string
  emoji: string
  benefits: string[]
  helpsAddress: string[]
  didYouKnow: string
}

/* ─── Ingredient Data ────────────────────────────────────── */

const INGREDIENT_DATA: Record<string, IngredientInfo> = {
  "aloe-vera": {
    label: "Aloe Vera",
    emoji: "🌿",
    category: "Skin Active",
    tagline: "Nature's Universal Skin & Hair Soother",
    description: "Aloe Vera is the most widely used botanical in the Nezal range — present in over 65 formulations. Rich in vitamins, minerals, amino acids, and antioxidants, it is a lightweight yet powerful hydrator, soother, and skin conditioner that works across all skin types, including the most sensitive.",
    benefits: [
      "Soothes dry, irritated, and sensitive skin",
      "Supports skin hydration and moisture balance",
      "Calms redness and post-sun discomfort",
      "Conditions and softens hair and scalp",
      "Promotes comfortable, healthy-looking skin",
    ],
    helpsAddress: ["Dry and dehydrated skin", "Sensitive skin", "Post-wash skin tightness", "Scalp dryness", "Everyday skin and hair care"],
    didYouKnow: "Aloe Vera gel is 99% water, yet it holds powerful bioactive compounds including acemannan — a polysaccharide that supports skin cell regeneration.",
  },
  "neem": {
    label: "Neem",
    emoji: "🌿",
    category: "Botanical & Herbal Active",
    tagline: "Ayurvedic Antibacterial & Purifying Care",
    description: "Neem is one of Ayurveda's most revered purifying botanicals, with clinically recognised antibacterial, antifungal, and anti-inflammatory properties. In the Nezal range it appears across soaps, shampoo, bathing bars, and face wash — delivering daily purification for skin, scalp, and hair.",
    benefits: [
      "Natural antibacterial properties protect against acne-causing bacteria",
      "Antifungal care supports scalp health and reduces dandruff",
      "Anti-inflammatory properties calm redness and irritation",
      "Purifies pores and removes environmental impurities",
    ],
    helpsAddress: ["Acne and breakouts", "Oily and congested skin", "Dandruff and scalp buildup", "Skin and scalp infections", "Everyday purification"],
    didYouKnow: "Every part of the Neem tree — bark, leaves, seeds, and roots — has been used in Ayurvedic medicine for over 4,000 years. It is known as the 'village pharmacy' in India.",
  },
  "tulsi": {
    label: "Tulsi",
    emoji: "🌱",
    category: "Botanical & Herbal Active",
    tagline: "Sacred Herbal Disinfectant & Skin Balancer",
    description: "Tulsi — known as the Queen of Herbs in Ayurveda — is a potent natural disinfectant and skin-balancing botanical. It pairs with Neem in Nezal formulations to deliver a comprehensive antibacterial and purifying herbal care experience across skin, scalp, and body.",
    benefits: [
      "Natural disinfecting properties support daily skin protection",
      "Helps balance excess oil and maintain a fresh complexion",
      "Supports scalp wellness alongside Neem",
      "Gentle enough for daily use across all skin types",
    ],
    helpsAddress: ["Oily and acne-prone skin", "Scalp buildup", "Excess sebum", "Daily skin and scalp protection"],
    didYouKnow: "Tulsi (Holy Basil) is considered sacred in Hindu tradition and is grown in nearly every Indian household. Its name in Sanskrit means 'the incomparable one'.",
  },
  "turmeric": {
    label: "Turmeric",
    emoji: "🌟",
    category: "Botanical & Herbal Active",
    tagline: "Golden Brightening & Anti-Inflammatory Care",
    description: "Turmeric — one of India's most celebrated traditional skincare ingredients — brings its curcumin-powered anti-inflammatory and brightening properties to key Nezal products. Used carefully in formulation to deliver its radiance benefits without the staining that raw turmeric imparts.",
    benefits: [
      "Curcumin delivers powerful anti-inflammatory skin care",
      "Helps brighten complexion and reduce dark spots",
      "Traditional Indian botanical with thousands of years of use",
      "Supports even, healthy-looking skin tone",
    ],
    helpsAddress: ["Dull and uneven skin tone", "Pigmentation", "Inflammation and redness", "Skin brightening and glow"],
    didYouKnow: "Curcumin — the active compound in turmeric — has been studied in over 3,000 scientific publications for its anti-inflammatory and antioxidant properties.",
  },
  "tea-tree": {
    label: "Tea Tree",
    emoji: "🌿",
    category: "Botanical & Herbal Active",
    tagline: "Clarity, Purification & Acne Control",
    description: "Tea Tree Essential Oil is one of the most well-documented botanical actives for oily and acne-prone skin. Its natural antiseptic and antibacterial properties have been validated across multiple studies. In the Nezal range, Tea Tree appears in both face serum and intimate wash formulations.",
    benefits: [
      "Natural antiseptic and antibacterial properties target acne-causing bacteria",
      "Controls excess sebum without over-stripping the skin",
      "Purifies pores and refreshes oily skin",
      "Gentle daily protection for face and intimate skin care",
    ],
    helpsAddress: ["Acne and breakouts", "Excess oil and clogged pores", "Blemishes and skin congestion", "Intimate hygiene care"],
    didYouKnow: "Tea Tree oil is derived from Melaleuca alternifolia, native to Australia. Indigenous Australians used crushed tea tree leaves as a traditional remedy for thousands of years.",
  },
  "vitamin-c": {
    label: "Vitamin C",
    emoji: "🍊",
    category: "Skin Active",
    tagline: "Radiance, Brightness & Antioxidant Protection",
    description: "Vitamin C is one of the most potent antioxidant actives in modern skincare. In the Nezal range it appears as Ascorbic Acid in the face serum and as a brightening active in the Foaming Face Wash, where it works synergistically with Aloe Vera to cleanse and brighten simultaneously.",
    benefits: [
      "Promotes collagen production for firmer-looking skin",
      "Supports skin brightness and a healthy glow",
      "Helps fade dark spots and hyperpigmentation",
      "Provides antioxidant protection against environmental stressors",
      "Helps improve dull and tired-looking skin",
    ],
    helpsAddress: ["Pigmentation and dark spots", "Dull and tired skin", "Uneven complexion", "Early signs of ageing", "Sun damage"],
    didYouKnow: "Vitamin C is water-soluble and cannot be synthesised by the human body. Topical application delivers it directly to the skin where it can work most effectively.",
  },
  "hyaluronic-acid": {
    label: "Hyaluronic Acid",
    emoji: "💧",
    category: "Skin Active",
    tagline: "Deep Hydration Specialist",
    description: "Hyaluronic Acid is nature's most effective moisture-binding molecule — capable of holding up to 1,000 times its weight in water. In Nezal's serum formulations it delivers multi-level skin plumping and sustained hydration that lasts through the day.",
    benefits: [
      "Draws and retains moisture deep within the skin",
      "Creates a visibly plumper, smoother skin appearance",
      "Supports the skin's natural moisture barrier",
      "Lightweight hydration — absorbs without greasiness",
      "Suitable for all skin types including oily and sensitive",
    ],
    helpsAddress: ["Dry and dehydrated skin", "Fine lines caused by dryness", "Mature skin", "Loss of skin plumpness", "Winter dryness"],
    didYouKnow: "Hyaluronic Acid is naturally produced by the body and found in high concentrations in the eyes and joints. Skin naturally loses HA with age — topical application helps replenish it.",
  },
  "niacinamide": {
    label: "Niacinamide",
    emoji: "✨",
    category: "Skin Active",
    tagline: "The Multi-Tasking Skin Expert",
    description: "Niacinamide is one of the most clinically researched skincare actives available. It works at a cellular level to improve skin tone, strengthen the skin barrier, reduce the appearance of pores, and support radiance — making it a cornerstone ingredient in Nezal's targeted face serum range.",
    benefits: [
      "Supports brighter and more even-looking skin tone",
      "Helps minimise the visible appearance of pores",
      "Strengthens the skin's natural barrier function",
      "Reduces post-inflammatory skin redness",
      "Rebuilds healthy skin cells and retains moisture",
    ],
    helpsAddress: ["Pigmentation and dark spots", "Dull and uneven skin tone", "Enlarged pores", "Acne marks", "Compromised skin barrier"],
    didYouKnow: "Niacinamide (Vitamin B3) is one of the few skincare ingredients that works well with almost every other active — including retinol, AHAs, BHAs, and Vitamin C.",
  },
  "rose": {
    label: "Rose",
    emoji: "🌸",
    category: "Botanical & Herbal Active",
    tagline: "Timeless Floral Hydration & Skin Comfort",
    description: "Rose extract and rose water have been used in beauty rituals for thousands of years across Persia, India, and the Mediterranean. Rich in antioxidants, vitamins, and natural tannins, rose delivers hydration, toning, and a delicate fragrance experience.",
    benefits: [
      "Natural toning properties tighten and refresh the skin",
      "Rich in antioxidants that protect against free radical damage",
      "Hydrates and soothes sensitive and dry skin",
      "Delivers a luxurious natural fragrance experience",
    ],
    helpsAddress: ["Dry and sensitive skin", "Dull complexion", "Skin tightness", "Daily skin toning", "Stress relief through aromatherapy"],
    didYouKnow: "It takes approximately 60,000 roses to produce just 30ml of pure rose essential oil — making it one of the most precious botanical ingredients in skincare.",
  },
  "bhringraj": {
    label: "Bhringraj",
    emoji: "🌱",
    category: "Hair Care Active",
    tagline: "Ayurvedic King of Hair",
    description: "Bhringraj — literally 'ruler of hair' in Sanskrit — is the most celebrated Ayurvedic herb for hair wellness. Used in traditional Indian hair care for centuries, it supports scalp circulation, strengthens hair roots, and is known to reduce hair fall with regular use.",
    benefits: [
      "Supports scalp blood circulation to nourish hair roots",
      "Traditionally used to reduce hair fall with regular use",
      "Strengthens hair from the root to reduce breakage",
      "Promotes the appearance of thicker, healthier hair",
    ],
    helpsAddress: ["Hair fall", "Weak hair roots", "Scalp health", "Hair thinning", "Premature greying"],
    didYouKnow: "Bhringraj (Eclipta prostrata) has been referenced in Charaka Samhita — one of the foundational texts of Ayurveda — as a rasayana (rejuvenating herb) for hair and brain health.",
  },
  "shea-butter": {
    label: "Shea Butter",
    emoji: "🧈",
    category: "Nourishing & Emollient",
    tagline: "Deep Nourishment, Softness & Moisture Care",
    description: "Shea Butter is one of the richest natural emollients available in skincare — extracted from the Shea tree nut and packed with essential fatty acids, Vitamins A and E, and anti-inflammatory compounds. It appears across 17 Nezal products.",
    benefits: [
      "Deeply conditions and softens even the driest skin",
      "Repairs the skin's natural moisture barrier",
      "Rich in Vitamins A and E for nourishing skin care",
      "Non-comedogenic — nourishes without clogging pores",
    ],
    helpsAddress: ["Dry and rough skin", "Cracked heels", "Winter dryness", "Skin barrier repair", "Body nourishment"],
    didYouKnow: "Shea Butter has been used in Africa for centuries — both as a food source and as a skin protectant against the harsh sun and dry climate. It is also called 'women's gold' due to its economic importance.",
  },
  "salicylic-acid": {
    label: "Salicylic Acid",
    emoji: "🧪",
    category: "Skin Active",
    tagline: "Pore-Clearing Acne & Oil Control Active",
    description: "Salicylic Acid is a beta-hydroxy acid (BHA) that penetrates the pore lining to dissolve excess sebum and clear congestion from within — making it the most effective topical ingredient for acne-prone and oily skin.",
    benefits: [
      "Penetrates pores to dissolve excess oil and congestion",
      "Helps reduce acne and breakouts with regular use",
      "Minimises the visible appearance of pores",
      "Exfoliates gently to prevent dead-skin buildup",
      "Controls excess sebum without over-drying the skin",
    ],
    helpsAddress: ["Acne and breakouts", "Oily and congested skin", "Clogged pores", "Blackheads and whiteheads", "Combination skin"],
    didYouKnow: "Salicylic Acid is derived from willow bark — the same plant source as aspirin. Its oil-soluble nature is what makes it uniquely effective at penetrating into pores.",
  },
}

function toLabel(slug: string) {
  return INGREDIENT_DATA[slug]?.label || slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ─── Skeleton ───────────────────────────────────────────── */

function IngredientSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-64 bg-neutral-100" />
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col gap-6">
        <div className="h-6 w-48 bg-neutral-100 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-neutral-100 rounded-2xl" />)}
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */

export default function IngredientPage() {
  const params = useParams()
  const slug = params.slug as string

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const info = INGREDIENT_DATA[slug]
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
  <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
    <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
      <Link href="/" className="hover:text-[var(--color-brand-primary)] flex items-center gap-1">
        <Home size={13} /> Home
      </Link>
      <ChevronRight size={13} />
      <span>Ingredient</span>
      <ChevronRight size={13} />
      <span className="text-[var(--color-text-heading)] font-medium">{label}</span>
    </nav>

      <div>
    <div className="flex flex-col md:flex-row md:items-start gap-8">

      {/* Left — text */}
      <div className="flex flex-col gap-3 flex-1 max-w-2xl">
        <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-sm font-medium">
          <Leaf size={13} /> {info?.category || "Ingredient"}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-heading)] leading-tight">
          {label}
        </h1>
        {info?.tagline && (
          <p className="text-lg font-medium italic text-[var(--color-brand-primary)]">
            {info.tagline}
          </p>
        )}
        {info?.description && (
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {info.description}
          </p>
        )}

        {/* Did You Know — shows below text on mobile */}
        {info?.didYouKnow && (
          <div className="md:hidden mt-2 bg-white rounded-2xl border-3 border-[var(--color-border)] p-4 ">
            <div className="flex items-center gap-2 mb-2 ">
              <Sparkles size={15} className="text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Did you know?</p>
            </div>
            <p className="text-sm text-[var(--color-text-body)] leading-relaxed">{info.didYouKnow}</p>
          </div>
        )}
      </div>

      {/* Right — image + did you know */}
      <div className="flex flex-col gap-4 md:w-80 flex-shrink-0 ">

        {/* Ingredient image */}
        <div className="relative w-full h-56 md:h-64 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-white">
          <Image
            src={`/ingredients/${slug === "bhringraj" ? "bringraj" : slug}.${
              ["turmeric", "vitamin-c", "tulsi", "shea-butter", "rose", "bringraj"].includes(
                slug === "bhringraj" ? "bringraj" : slug
              ) ? "webp"
              : slug === "tea-tree" ? "png"
              : "jpg"
            }`}
            alt={label}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.jpg"
            }}
          />
          {/* subtle green tint overlay */}
          <div className="absolute inset-0 bg-[#1e3a28]/5" />
        </div>

        
      </div>
  </div>

      {/* Did You Know — desktop */}
          {info?.didYouKnow && (
            <div className="hidden md:block bg-white rounded-2xl border border-[var(--color-border)] p-4 mt-8 ">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-amber-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Did you know?</p>
              </div>
              <p className="text-sm text-[var(--color-text-body)] leading-relaxed">{info.didYouKnow}</p>
            </div>
          )}
      

    </div>
  </div>
</section>

      {/* ── Benefits + Helps Address ── */}
      {info && (
        <section className="border-b border-[var(--color-border)] bg-white">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Key Benefits */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FlaskConical size={18} className="text-[var(--color-brand-primary)]" />
                  <h2 className="text-base font-bold text-[var(--color-text-heading)] uppercase tracking-widest">
                    Key Benefits
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {info.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[var(--color-brand-primary)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--color-text-body)]">{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helps Address */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Leaf size={18} className="text-[var(--color-brand-primary)]" />
                  <h2 className="text-base font-bold text-[var(--color-text-heading)] uppercase tracking-widest">
                    Helps Address
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {info.helpsAddress.map((h, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border"
                      style={{ backgroundColor: "#f0f7f0", borderColor: "#c8dac9", color: "#1e3a28" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Products ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-heading)]">
            Products with {label}
          </h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {notFound || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Leaf size={40} className="text-[var(--color-brand-primary)]/30" />
            <p className="text-[var(--color-text-muted)] text-lg">No products found with this ingredient yet.</p>
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