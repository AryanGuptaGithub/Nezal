"use client"
// app/admin/rituals/add/page.tsx
//
// Admin form to create a new Ritual: basic info, hero image, ordered
// routine steps, and a product picker (search + add) for the curated list.

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, X, Upload, Plus, GripVertical } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Step {
  stepNumber: number
  title: string
  description: string
  productId?: string
}

interface ProductLite {
  _id: string
  name: string
  image: string
  price: number
}

export default function AddRitualPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [heroImage, setHeroImage] = useState("")
  const [color, setColor] = useState("#F3F5EF")
  const [isActive, setIsActive] = useState(true)

  const [steps, setSteps] = useState<Step[]>([])
  const [stepInput, setStepInput] = useState({ title: "", description: "" })

  const [idealFor, setIdealFor] = useState("")

  const [productSearch, setProductSearch] = useState("")
  const [searchResults, setSearchResults] = useState<ProductLite[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductLite[]>([])

  useEffect(() => {
    if (!session) { router.push("/auth/login") }
  }, [session, router])

  // auto-slug from name
  useEffect(() => {
    if (!slug && name) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    }
  }, [name, slug])

  // product search (debounced)
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

  const addStep = () => {
    if (!stepInput.title.trim()) { setMessage("Step title is required."); return }
    setSteps((prev) => [...prev, { stepNumber: prev.length + 1, title: stepInput.title, description: stepInput.description }])
    setStepInput({ title: "", description: "" })
    setMessage("")
  }
  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })))
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
    if (!name.trim() || !slug.trim()) { setMessage("Name and slug are required."); return }
    setLoading(true); setMessage("")
    try {
      const res = await fetch("/api/rituals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, tagline, description, heroImage, color, isActive,
          steps,
          idealFor: idealFor.split("\n").map((s) => s.trim()).filter(Boolean),
          products: selectedProducts.map((p) => p._id),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create ritual")
      setMessage("Ritual created successfully!")
      setTimeout(() => router.push("/admin/rituals"), 1200)
    } catch (err: any) {
      setMessage(err.message || "Error creating ritual.")
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/rituals">
          <Button variant="ghost" className="mb-6 bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back to Rituals</Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Add New Ritual</h1>

        <Card>
          <CardHeader><CardTitle>Ritual Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ritual Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clear Skin Ritual" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug *</label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="clear-skin-ritual" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tagline (shown on homepage card)</label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Wake up to clearer, calmer skin" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (shown on ritual page)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background" placeholder="Longer intro paragraph for the ritual hero section" />
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

              <div>
                <label className="block text-sm font-medium mb-2">Ideal For <span className="text-muted-foreground font-normal">(one per line — shown as pills)</span></label>
                <textarea
                  value={idealFor}
                  onChange={(e) => setIdealFor(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder={"Oily skin\nAcne-prone skin\nTeenagers & young professionals\nCombination skin"}
                />
              </div>

              {/* ── Routine Steps ── */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 border-b">
                  <h2 className="text-sm font-semibold">Routine Steps</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ordered steps shown on the ritual page (e.g. Cleanse → Treat → Moisturize)</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input value={stepInput.title} onChange={(e) => setStepInput((p) => ({ ...p, title: e.target.value }))} placeholder="Step title, e.g. Cleanse" />
                    <Input value={stepInput.description} onChange={(e) => setStepInput((p) => ({ ...p, description: e.target.value }))} placeholder="Short description" />
                  </div>
                  <Button type="button" onClick={addStep} variant="outline" size="sm" className="w-full"><Plus className="w-4 h-4 mr-1" />Add Step</Button>

                  {steps.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 bg-background border rounded-lg px-3 py-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 text-sm">
                            <span className="font-bold">{step.stepNumber}. {step.title}</span>
                            {step.description && <p className="text-muted-foreground text-xs mt-0.5">{step.description}</p>}
                          </div>
                          <button type="button" onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Curated Products ── */}
              <div className="border rounded-xl h-80 overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 border-b">
                  <h2 className="text-sm font-semibold">Curated Products</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Search and add products that belong to this ritual</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="relative ">
                    <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products by name..." />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto ">
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

              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Create Ritual"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}