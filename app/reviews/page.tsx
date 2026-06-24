// app/reviews/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react"

/* ─── Types ─────────────────────────────────────────────── */

interface Review {
  id: string
  productId: string
  productName: string
  productImage: string
  company: string
  customerName: string
  rating: number
  comment: string
  reply: { message: string; repliedByName: string; repliedAt: string } | null
  createdAt: string
}

/* ─── Helpers ────────────────────────────────────────────── */

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Product info */}
      <Link
        href={`/shop/${review.company}`}
        className="flex items-center gap-3 group"
      >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--color-bg-cream)] flex-shrink-0">
          <Image
            src={review.productImage}
            alt={review.productName}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--color-text-muted)] font-medium">{review.company}</p>
          <p className="text-sm font-semibold text-[var(--color-text-heading)] truncate group-hover:text-[var(--color-brand-primary)] transition-colors">
            {review.productName}
          </p>
        </div>
      </Link>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Reviewer + rating */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-brand-primary)] flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-heading)]">
              {review.customerName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {/* Comment */}
      <p className="text-sm text-[var(--color-text-body)] leading-relaxed">
        {review.comment}
      </p>

      {/* Admin reply */}
      {review.reply && (
        <div className="bg-[var(--color-bg-cream)] rounded-xl p-3 flex gap-2">
          <MessageCircle size={14} className="text-[var(--color-brand-primary)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-brand-primary)] mb-1">
              Nezal replied
            </p>
            <p className="text-xs text-[var(--color-text-body)] leading-relaxed">
              {review.reply.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Rating summary bar ─────────────────────────────────── */

function RatingBar({
  star, count, total, active, onClick,
}: {
  star: number; count: number; total: number; active: boolean; onClick: () => void
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full group transition-opacity ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
    >
      <span className="text-xs font-medium w-4 text-right text-[var(--color-text-muted)]">{star}</span>
      <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-text-muted)] w-6 text-right">{count}</span>
    </button>
  )
}

/* ─── Page ───────────────────────────────────────────────── */

export default function ReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [sort, setSort]             = useState<"newest" | "highest" | "lowest">("newest")

  // For rating distribution — fetch all once
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  })
  const [avgRating, setAvgRating] = useState(0)

  // Fetch distribution once on mount
  useEffect(() => {
    fetch("/api/products/reviews/all?limit=500")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        let sum = 0
        data.reviews.forEach((r: Review) => {
          dist[r.rating] = (dist[r.rating] || 0) + 1
          sum += r.rating
        })
        setDistribution(dist)
        setAvgRating(data.reviews.length > 0 ? sum / data.reviews.length : 0)
      })
      .catch(() => {})
  }, [])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        sort,
        ...(ratingFilter ? { rating: String(ratingFilter) } : {}),
      })
      const res  = await fetch(`/api/products/reviews/all?${params}`)
      const data = await res.json()
      if (data.success) {
        setReviews(data.reviews)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch {}
    finally { setLoading(false) }
  }, [page, sort, ratingFilter])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [sort, ratingFilter])

  const totalReviews = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <main className="min-h-screen bg-[var(--color-bg-cream)]">

      {/* Hero */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-primary)] mb-2">
            Customer Reviews
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-heading)] mb-3">
            What Our Customers Say
          </h1>
          <p className="text-[var(--color-text-muted)] max-w-xl mx-auto text-sm">
            Real reviews from real customers. We believe in transparency — every review is genuine.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ── */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 sticky top-24">

              {/* Average rating */}
              <div className="text-center pb-4 border-b border-[var(--color-border)] mb-4">
                <p className="text-5xl font-bold text-[var(--color-text-heading)]">
                  {avgRating.toFixed(1)}
                </p>
                <StarRating rating={Math.round(avgRating)} size={18} />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Based on {totalReviews} reviews
                </p>
              </div>

              {/* Rating bars */}
              <div className="flex flex-col gap-2 pb-4 border-b border-[var(--color-border)] mb-4">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    star={star}
                    count={distribution[star] || 0}
                    total={totalReviews}
                    active={ratingFilter === star}
                    onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                  />
                ))}
              </div>

              {/* Clear filter */}
              {ratingFilter && (
                <button
                  onClick={() => setRatingFilter(null)}
                  className="w-full text-xs font-semibold text-[var(--color-brand-primary)] hover:underline mb-4"
                >
                  Clear filter
                </button>
              )}

              {/* Sort */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                  Sort by
                </p>
                <div className="flex flex-col gap-1">
                  {(["newest", "highest", "lowest"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        sort === s
                          ? "bg-[var(--color-brand-primary)] text-white"
                          : "text-[var(--color-text-body)] hover:bg-[var(--color-bg-cream)]"
                      }`}
                    >
                      {s === "newest" ? "Newest first" : s === "highest" ? "Highest rated" : "Lowest rated"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Reviews grid ── */}
          <div className="flex-1 min-w-0">

            {/* Result count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[var(--color-text-muted)]">
                {ratingFilter
                  ? `Showing ${total} × ${ratingFilter}-star reviews`
                  : `Showing all ${total} reviews`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-5/6" />
                      <div className="h-3 bg-gray-200 rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <Star size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--color-text-muted)]">No reviews found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-[var(--color-border)] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-[var(--color-text-muted)]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-[var(--color-brand-primary)] text-white"
                            : "border border-[var(--color-border)] hover:bg-white"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-[var(--color-border)] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}