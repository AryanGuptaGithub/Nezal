"use client"

/**
 * DiscoverRituals
 *
 * Homepage section: "Discover Your Perfect Rituals" — fetches active
 * rituals from /api/rituals and renders them as image cards linking to
 * /rituals/[slug]. Mirrors ShopByConcern's visual style.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface RitualCard {
  name: string
  slug: string
  tagline: string
  heroImage: string
  color: string
}

export function DiscoverRituals() {
  const [rituals, setRituals] = useState<RitualCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch("/api/rituals")
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        if (mounted) setRituals(data.rituals || [])
      } catch {
        if (mounted) setRituals([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (!loading && rituals.length === 0) return null

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: "#ffffff" }}>
      <div className="container-nezal">

        {/* Heading */}
        <div className="flex flex-col items-center gap-2 text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-widest">
            Our Signature Rituals, Curated For You
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "#1e3a28" }}>
            Discover Your Perfect Ritual
          </h2>
          <p className="text-sm md:text-base max-w-lg" style={{ color: "#6b7c70" }}>
            Step-by-step routines, curated product sets — designed around how you actually want to feel.
          </p>
        </div>

        {/* Ritual grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
              ))
            : rituals.map((ritual) => (
                <Link
                  key={ritual.slug}
                  href={`/rituals/${ritual.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: "var(--color-border)", backgroundColor: ritual.color || "#F3F5EF" }}
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                    {ritual.heroImage ? (
                      <img
                        src={ritual.heroImage}
                        alt={ritual.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Add image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                    <span className="text-sm font-bold" style={{ color: "#1e3a28" }}>
                      {ritual.name}
                    </span>
                    {ritual.tagline && (
                      <span className="text-xs leading-snug" style={{ color: "#6b7c70" }}>
                        {ritual.tagline}
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 mt-1"
                      style={{ color: "#2a5c3a" }}
                    >
                      Explore <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
        </div>

      </div>
    </section>
  )
}