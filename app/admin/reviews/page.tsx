"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Star, Check, X, Trash2, MessageCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "pending" | "approved" | "rejected" | "all"

interface Review {
  _id: string
  productName: string
  productImage: string
  company: string
  userName: string
  userEmail: string
  rating: number
  comment: string
  status: Status
  reply?: { message: string }
  createdAt: string
  product?: { name: string; image: string }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={12}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<Status>("pending")
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts]         = useState({ pending: 0, approved: 0, rejected: 0 })
  const [acting, setActing]         = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/reviews?status=${activeTab}&page=${page}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setTotalPages(data.totalPages || 1)
    } finally { setLoading(false) }
  }, [activeTab, page])

  // Fetch counts for tab badges
  const fetchCounts = async () => {
    const [p, a, r] = await Promise.all([
      fetch("/api/admin/reviews?status=pending&limit=1").then(r => r.json()),
      fetch("/api/admin/reviews?status=approved&limit=1").then(r => r.json()),
      fetch("/api/admin/reviews?status=rejected&limit=1").then(r => r.json()),
    ])
    setCounts({ pending: p.total || 0, approved: a.total || 0, rejected: r.total || 0 })
  }

  useEffect(() => { fetchReviews(); fetchCounts() }, [fetchReviews])
  useEffect(() => { setPage(1) }, [activeTab])

  const act = async (id: string, action: "approve" | "reject") => {
    setActing(id)
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setActing(null)
    fetchReviews()
    fetchCounts()
  }

  const del = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return
    setActing(id)
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
    setActing(null)
    fetchReviews()
    fetchCounts()
  }

  const tabs: { key: Status; label: string }[] = [
    { key: "pending",  label: "Pending"  },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All"      },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <button onClick={() => { fetchReviews(); fetchCounts() }}
          className="p-2 rounded-xl border hover:bg-muted transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-foreground text-background"
                : "border hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab.key === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : tab.key === "approved"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {counts[tab.key as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No {activeTab} reviews.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id}
              className="bg-white border-[#b2b1b1] border  rounded-2xl p-4 flex gap-4 items-start"
            >
              {/* Product image */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={review.product?.image || "/placeholder.jpg"}
                  alt={review.product?.name || "Product"}
                  fill className="object-cover"
                />
              </div>

              

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex w-[50%] items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">{review.product?.name}</p>
                    <p className="text-xs text-muted-foreground">{review.userName} · {review.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2 ">
                    <Stars rating={review.rating} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      review.status === "approved" ? "bg-green-700 text-white"
                      : review.status === "rejected" ? "bg-red-700 text-white"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                      {review.status}
                    </span>
                  </div>
                </div>
                <p className="text-bold italic mt-2 text-[#095b0b]">
                 " {review.comment} "
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-row gap-2 flex-shrink-0">
                {review.status !== "approved" && (
                  <button onClick={() => act(review._id, "approve")}
                    disabled={acting === review._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-700 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Check size={12} /> Approve
                  </button>
                )}
                {review.status !== "rejected" && (
                  <button onClick={() => act(review._id, "reject")}
                    disabled={acting === review._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-700 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <X size={12} /> Reject
                  </button>
                )}
                <button onClick={() => del(review._id)}
                  disabled={acting === review._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-black hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium border transition-colors ${
                page === p ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}