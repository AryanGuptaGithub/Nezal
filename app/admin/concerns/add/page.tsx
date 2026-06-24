"use client"
// app/admin/concerns/add/page.tsx
//
// Admin form to create a new Concern: label/slug/headline/subheadline,
// hero image, color, and a product picker (search + add) for the
// recommended product list.

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, X, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProductLite {
  _id: string
  name: string
  image: string
  price: number
}

export default function AddConcernPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const [label, setLabel] = useState("")
  const [slug, setSlug] = useState("")
  const [headline, setHeadline] = useState("")
  const [subheadline, setSubheadline] = useState("")
  const [description, setDescription] = useState("")
  const [heroImage, setHeroImage] = useState("")
  const [color, setColor] = useState("#F3F5EF")
  const [isActive, setIsActive] = useState(true)

  const [productSearch, setProductSearch] = useState("")
  const [searchResults, setSearchResults] = useState<ProductLite[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductLite[]>([])

  useEffect(() => {
    if (!session) { router.push("/auth/login") }
  }, [session, router])

  useEffect(() => {
    if (!slug && label) {
      setSlug(label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    }
  }, [label, slug])

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

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.urls?.[0]) setHeroImage(data.urls[0])
    } catch { setMessage("Error uploading image.") }
    finally { setUploading(false); e.target.value = "" }
  }

  const addProduct = (p: ProductLite) => {
    if (selectedProducts.find((sp) => sp._id === p._id)) return
    setSelectedProducts((prev) => [...prev, p])
    setProductSearch("")
    setSearchResults([])
  }
  const removeProduct = (id: string) => setSelectedProducts((prev) => prev.filter((p) => p._id !== id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !slug.trim()) { setMessage("Label and slug are required."); return }
    setLoading(true); setMessage("")
    try {
      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label, slug, headline, subheadline, description, heroImage, color, isActive,
          products: selectedProducts.map((p) => p._id),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create concern")
      setMessage("Concern created successfully!")
      setTimeout(() => router.push("/admin/concerns"), 1200)
    } catch (err: any) {
      setMessage(err.message || "Error creating concern.")
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/concerns">
          <Button variant="ghost" className="mb-6 bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back to Concerns</Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Add New Concern</h1>

        <Card>
          <CardHeader><CardTitle>Concern Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Label *</label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Acne & Oil Control" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug *</label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acne-oil-control" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Headline (page H1 — optional, falls back to label)</label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Clear Skin Starts Here" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subheadline</label>
                <Input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="e.g. Targeted herbal formulas that fight acne at the root" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background" placeholder="Longer paragraph for the concern page" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Image</label>
                  <label className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                    <div className="text-center">
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs">{uploading ? "Uploading..." : "Upload image"}</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleHeroUpload} disabled={uploading} className="hidden" />
                  </label>
                  {heroImage && (
                    <div className="relative h-24 w-full mt-2 rounded-lg overflow-hidden">
                      <Image src={heroImage} alt="Hero preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color (hex)</label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#F3F5EF" />
                  <div className="h-8 w-full rounded mt-2 border" style={{ backgroundColor: color }} />
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 border-b ">
                  <h2 className="text-sm font-semibold">Recommended Products</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Search and add products that address this concern</p>
                </div>
                <div className="p-4 space-y-3 h-50">
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
                          <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden bg-muted">
                            {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" />}
                          </div>
                          <span className="text-sm flex-1">{p.name}</span>
                          <button type="button" onClick={() => removeProduct(p._id)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
                <label className="text-sm font-medium">Active (visible on homepage)</label>
              </div>

              {message && (
                <div className={`p-3 rounded text-sm ${message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message}</div>
              )}

              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Create Concern"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}