"use client"

/**
 * All Rituals index page — /rituals
 *
 * Shows the full list of admin-managed rituals as image cards,
 * same visual style as the homepage "Discover Your Perfect Ritual"
 * preview, just without the cap. Mirrors app/concerns/page.tsx.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronRight, Home, Sparkles } from "lucide-react"

interface RitualCard {
  name: string
  slug: string
  tagline: string
  heroImage: string
  color: string
  sortOrder?: number
}

function RitualsSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdfaf5" }}>
      <div className="container-nezal py-12">
        <div className="h-8 w-64 bg-gray-100 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AllRitualsPage() {
  const [rituals, setRituals] = useState<RitualCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch("/api/rituals")
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        // API already returns rituals sorted by sortOrder, so no
        // client-side reordering is needed here (unlike concerns).
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

  if (loading) return <RitualsSkeleton />

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#fdfaf5" }}>

      {/* ── Header ── */}
      <section className="border-b border-[var(--color-border)]">
        <div className="container-nezal py-10 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
            <Link href="/" className="hover:text-[var(--color-brand-primary)] flex items-center gap-1">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} />
            <span className="text-[var(--color-text-heading)] font-medium">Rituals</span>
          </nav>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-widest mb-3">
            Our Signature Rituals
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold" style={{ color: "#1e3a28" }}>
            All Rituals
          </h1>
          <p className="text-sm md:text-base max-w-lg mt-3" style={{ color: "#6b7c70" }}>
            Step-by-step routines, curated product sets — designed around how you actually want to feel.
          </p>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="container-nezal py-12">
        {rituals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Sparkles size={40} className="text-[var(--color-brand-primary)]/30" />
            <p className="text-[var(--color-text-muted)] text-lg">
              No rituals have been added yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {rituals.map((ritual) => (
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
                    <div className="flex h-full items-center justify-center text-xs text-gray-400 px-2 text-center">
                      Add image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
        )}
      </section>

    </main>
  )
}