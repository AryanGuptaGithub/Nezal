"use client"
// app/admin/flash-sales/add/page.tsx

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProductLite {
  _id: string
  name: string
  image: string
  price: number
}

// Format a Date as "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AddFlashSalePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const [name, setName] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")
  const [startsAt, setStartsAt] = useState(toLocalInputValue(new Date()))
  const [endsAt, setEndsAt] = useState(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const [isActive, setIsActive] = useState(true)

  const [productSearch, setProductSearch] = useState("")
  const [searchResults, setSearchResults] = useState<ProductLite[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductLite[]>([])

  useEffect(() => {
    if (!session) { router.push("/auth/login") }
  }, [session, router])

  useEffect(() => {
    const term = productSearch.trim()
    if (term.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(term)}&limit=8`)
        const data = await res.json()
        setSearchResults((data.products || data || []).map((p: any) => ({
          _id: p._id, name: p.name, image: p.image, price: p.price,
        })))
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  const addProduct = (p: ProductLite) => {
    if (selectedProducts.find((sp) => sp._id === p._id)) return
    setSelectedProducts((prev) => [...prev, p])
    setProductSearch("")
    setSearchResults([])
  }
  const removeProduct = (id: string) => setSelectedProducts((prev) => prev.filter((p) => p._id !== id))

  // Live preview of the discounted price for the first selected product
  const discountPreview = (price: number) => {
    const pct = Number(discountPercent) || 0
    const discounted = Math.round(price - (price * pct) / 100)
    return discounted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setMessage("Name is required."); return }
    const pct = Number(discountPercent)
    if (!pct || pct <= 0 || pct > 90) { setMessage("Discount must be between 1 and 90%."); return }
    if (selectedProducts.length === 0) { setMessage("Add at least one product."); return }
    if (new Date(endsAt) <= new Date(startsAt)) { setMessage("End time must be after start time."); return }

    setLoading(true); setMessage("")
    try {
      const res = await fetch("/api/flash-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          discountPercent: pct,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          products: selectedProducts.map((p) => p._id),
          isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create flash sale")
      setMessage("Flash sale created successfully!")
      setTimeout(() => router.push("/admin/flash-sales"), 1200)
    } catch (err: any) {
      setMessage(err.message || "Error creating flash sale.")
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/flash-sales">
          <Button variant="ghost" className="mb-6 bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back to Flash Sales</Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Create Flash Sale</h1>

        <Card>
          <CardHeader><CardTitle>Sale Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm font-medium mb-2">Sale Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali Flash Sale" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount Percentage *</label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="e.g. 25"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Applied to the regular price of each selected product while the sale is live</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Starts At *</label>
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ends At *</label>
                  <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 border-b">
                  <h2 className="text-sm font-semibold">Products on Sale</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Search and add the products this discount applies to</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products by name..." />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((p) => (
                          <button key={p._id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted text-left">
                            <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden bg-muted">
                              {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" />}
                            </div>
                            <span className="text-sm">{p.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">₹{p.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {selectedProducts.map((p) => (
                        <div key={p._id} className="flex items-center gap-3 bg-background border rounded-lg px-3 py-2">
                          <div className="relative h-9 w-9 shrink-0 rounded overflow-hidden bg-muted">
                            {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{p.name}</p>
                            {discountPercent && Number(discountPercent) > 0 && (
                              <p className="text-xs">
                                <span className="line-through text-muted-foreground">₹{p.price}</span>
                                {" → "}
                                <span className="font-bold text-amber-600">₹{discountPreview(p.price)}</span>
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={() => removeProduct(p._id)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
                <label className="text-sm font-medium">Active (enabled — will go live automatically at the start time)</label>
              </div>

              {message && (
                <div className={`p-3 rounded text-sm ${message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message}</div>
              )}

              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Create Flash Sale"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
