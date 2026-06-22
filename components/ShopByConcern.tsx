"use client"

/**
 * ShopByConcern
 *
 * Homepage section that lets visitors jump straight into a concern-based
 * product list (Acne, Pigmentation, Open Pores, Hydration, Hair Fall,
 * Dryness) without going through the header's mega menu first.
 *
 * Uses real images instead of icons — just drop image URLs into the
 * CONCERNS array below (Cloudinary, Unsplash, or any hosted image works).
 *
 * Links to the existing /concerns/[slug] pages — no new routes needed.
 */

import Link from "next/link"
import { ArrowRight } from "lucide-react"

const CONCERNS = [
  {
    label: "Acne",
    slug: "acne",
    image: "https://cdn-prod.medicalnewstoday.com/content/images/articles/107/107146/acne.jpg", // ← paste image URL here
  },
  {
    label: "Pigmentation",
    slug: "pigmentation",
    image: "https://www.london-dermatology-centre.co.uk/blog/wp-content/uploads/2025/05/Cover-Pigmentation.webp", // ← paste image URL here
  },
  {
    label: "Open Pores",
    slug: "open-pores",
    image: "https://plasticsurgeonmonisha.com/wp-content/uploads/2019/11/How-to-Reduce-open-pores.jpg", // ← paste image URL here
  },
  {
    label: "Hydration",
    slug: "hydration",
    image: "https://cdn.shopify.com/s/files/1/0503/2932/1627/files/tips_for_skin_hydration_480x480.jpg?v=1677251780", // ← paste image URL here
  },
  {
    label: "Hair Fall",
    slug: "hairfall",
    image: "https://www.drbatras.com/themes/drbatra/images/treatment-images/hair-fall-treatment/Hero-section-image-1.webp", // ← paste image URL here
  },
  {
    label: "Dryness",
    slug: "dryness",
    image: "https://images.apollo247.in/pd-cms/cms/2025-09/AdobeStock_416637532.webp?tr=q-80,f-webp,w-400,dpr-2.5,c-at_max%201000w", // ← paste image URL here
  },
]

export function ShopByConcern() {
  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: "#fdfaf5" }}>
      <div className="container-nezal">

        {/* Heading */}
        <div className="flex flex-col items-center gap-2 text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-widest">
            Shop By Concern
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "#1e3a28" }}>
            Find What Your Skin Needs
          </h2>
          <p className="text-sm md:text-base max-w-lg" style={{ color: "#6b7c70" }}>
            Tell us your concern, we'll show you the right products — curated formulas for your specific skin and hair needs.
          </p>
        </div>

        {/* Concern grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {CONCERNS.map((concern) => (
            <Link
              key={concern.slug}
              href={`/concerns/${concern.slug}`}
              className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: "var(--color-border)", backgroundColor: "#ffffff" }}
            >
              {/* Image */}
              <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                {concern.image ? (
                  <img
                    src={concern.image}
                    alt={concern.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    Add image
                  </div>
                )}
                {/* subtle dark gradient at bottom so label below stays readable if you later overlay text on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-1 px-3 pb-4">
                <span className="text-sm font-bold" style={{ color: "#1e3a28" }}>
                  {concern.label}
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ color: "#2a5c3a" }}
                >
                  Shop now <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}