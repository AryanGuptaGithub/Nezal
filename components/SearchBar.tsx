"use client"

/**
 * SearchBar
 *
 * Drop-in replacement for the old plain search <form> in the Header.
 * - Bigger, more prominent pill-shaped input with focus ring + shadow
 * - Live dropdown of matching products as the user types (debounced)
 * - Each result shows image, name, and price
 * - "View all results for '...'" link at the bottom of the dropdown
 * - Closes on outside click, Escape key, or selecting a result
 * - Keyboard support: Enter submits the full search, Esc closes dropdown
 *
 * Usage (replace the old <form> block in Header.tsx with):
 *   <SearchBar />
 *
 * Requires: an existing GET /api/products?search=<query>&limit=6 endpoint
 * that returns { products: [{ _id, name, price, discountPrice, image,
 * company: { slug } }] } — adjust the fetch URL/shape below if yours differs.
 */

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Loader2 } from "lucide-react"

interface SearchResultProduct {
  _id: string
  name: string
  price: number
  discountPrice?: number
  image: string
  company?: { slug: string; name?: string }
}

const DEBOUNCE_MS = 300
const MIN_CHARS = 2
const MAX_RESULTS = 6

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResultProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── Fetch matching products (debounced) ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < MIN_CHARS) {
      setResults([])
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const params = new URLSearchParams({ search: trimmed, limit: String(MAX_RESULTS) })
        const res = await fetch(`/api/products?${params}`, { signal: controller.signal })
        if (!res.ok) throw new Error("Search failed")
        const data = await res.json()
        const products: SearchResultProduct[] = data.products || data || []
        setResults(products.slice(0, MAX_RESULTS))
      } catch (err: any) {
        if (err?.name !== "AbortError") setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const goToProduct = useCallback((product: SearchResultProduct) => {
    setOpen(false)
    setQuery("")
    const companySlug = product.company?.slug || "shop"
    router.push(`/shop/${companySlug}/product/${product._id}`)
  }, [router])

  const submitFullSearch = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    setOpen(false)
    router.push(`/shop?search=${encodeURIComponent(trimmed)}`)
    setQuery("")
  }, [query, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitFullSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, -1))
      return
    }
    if (e.key === "Enter" && highlightedIndex >= 0 && results[highlightedIndex]) {
      e.preventDefault()
      goToProduct(results[highlightedIndex])
    }
  }

  const showDropdown = open && query.trim().length >= MIN_CHARS

  return (
    <div ref={containerRef} className="relative hidden md:block w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="flex items-center gap-3 rounded-full border-2 px-4 py-2.5 transition-all duration-200 bg-white"
          style={{
            borderColor: open ? "#2a5c3a" : "#078909",
            boxShadow: open ? "0 4px 20px rgba(42, 92, 58, 0.15)" : "none",
          }}
        >
          <Search
            className="h-5 w-5 shrink-0 transition-colors"
            style={{ color: open ? "#2a5c3a" : "green" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setHighlightedIndex(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, brands, ingredients..."
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "#2a5c3a" }} />}
          {!loading && query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
              className="shrink-0 rounded-full p-0.5 hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-white shadow-2xl"
          style={{ borderColor: "var(--color-border)" }}
        >
          {loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No products found for "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-[420px] overflow-y-auto py-2">
              {results.map((product, idx) => {
                const displayPrice = product.discountPrice || product.price
                const isHighlighted = idx === highlightedIndex
                return (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => goToProduct(product)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ backgroundColor: isHighlighted ? "#f0f7f0" : "transparent" }}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-gray-50" style={{ borderColor: "var(--color-border)" }}>
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text-heading)]">{product.name}</p>
                      {/* <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold" style={{ color: "#1e3a28" }}>₹{displayPrice}</span>
                        {product.discountPrice && (
                          <span className="text-xs line-through text-gray-400">₹{product.price}</span>
                        )}
                      </div> */}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {results.length > 0 && (
            <button
              type="button"
              onClick={submitFullSearch}
              className="block w-full border-t px-4 py-3 text-center text-sm font-semibold transition-colors hover:bg-[#f0f7f0]"
              style={{ borderColor: "var(--color-border)", color: "#2a5c3a" }}
            >
              View all results for "{query}" →
            </button>
          )}
        </div>
      )}
    </div>
  )
}