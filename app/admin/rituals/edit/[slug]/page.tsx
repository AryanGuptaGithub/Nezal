"use client"
// app/admin/rituals/edit/[slug]/page.tsx
//
// Admin form to edit an existing Ritual. Same shape as the Add page,
// but loads existing data first and PUTs to /api/rituals/[slug].

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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

export default function EditRitualPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const originalSlug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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
    if (!session) { router.push("/auth/login"); return }
    fetchRitual()
  }, [session, originalSlug])

  const fetchRitual = async () => {
    try {
      const res = await fetch(`/api/admin/rituals/${originalSlug}`)
      const data = await res.json()
      const r = data.ritual
      if (!r) throw new Error("Not found")

      setName(r.name || "")
      setSlug(r.slug || "")
      setTagline(r.tagline || "")
      setDescription(r.description || "")
      setHeroImage(r.heroImage || "")
      setColor(r.color || "#F3F5EF")
      setIsActive(r.isActive ?? true)
      setSteps((r.steps || []).map((s: any) => ({
        stepNumber: s.stepNumber, title: s.title, description: s.description,
        productId: s.productId?._id || s.productId,
      })))
      setIdealFor((r.idealFor || []).join("\n"))
      setSelectedProducts((r.products || []).map((p: any) => ({
        _id: p._id, name: p.name, image: p.image, price: p.price,
      })))
    } catch (e) {
      setMessage("Error loading ritual.")
    } finally {
      setLoading(false)
    }
  }

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
    setSubmitting(true); setMessage("")
    try {
      const res = await fetch(`/api/rituals/${originalSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, tagline, description, heroImage, color, isActive,
          steps,
          idealFor: idealFor.split("\n").map((s) => s.trim()).filter(Boolean),
          products: selectedProducts.map((p) => p._id),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update ritual")
      setMessage("Ritual updated successfully!")
      setTimeout(() => router.push("/admin/rituals"), 1200)
    } catch (err: any) {
      setMessage(err.message || "Error updating ritual.")
    } finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading ritual...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/rituals">
          <Button variant="ghost" className="mb-6 bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back to Rituals</Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Edit Ritual</h1>

        <Card>
          <CardHeader><CardTitle>Ritual Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ritual Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug *</label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tagline</label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
  <label className="block text-sm font-medium mb-2">Hero Image</label>
  <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/50">
    
    {/* URL input */}
    <div>
      <label className="block text-xs text-muted-foreground mb-1">Paste Image URL</label>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={heroImage}
          onChange={(e) => setHeroImage(e.target.value)}
          className="flex-1"
        />
        {heroImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHeroImage("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>

    {/* Divider */}
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>

    {/* File upload */}
    <label className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition">
      <div className="text-center">
        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs font-medium">
          {uploading ? "Uploading..." : "Upload from device"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 5MB</p>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleHeroUpload}
        disabled={uploading}
        className="hidden"
      />
    </label>

    {/* Preview */}
    {heroImage && (
      <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border">
        <Image src={heroImage} alt="Hero preview" fill className="object-cover" />
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
          Preview
        </div>
      </div>
    )}
  </div>
</div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color (hex)</label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
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
                  placeholder={"Oily skin\nAcne-prone skin\nTeenagers & young professionals"}
                />
              </div>

             <div className="border rounded-xl overflow-hidden">
  <div className="bg-muted/60 px-4 py-3 border-b">
    <h2 className="text-sm font-semibold">Routine Steps</h2>
  </div>

  <div className="p-4 h-[250px] flex flex-col">
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          value={stepInput.title}
          onChange={(e) =>
            setStepInput((p) => ({ ...p, title: e.target.value }))
          }
          placeholder="Step title, e.g. Cleanse"
          className="border-2 border-[#35b308]"
        />

        <Input
          value={stepInput.description}
          onChange={(e) =>
            setStepInput((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Short description"
          className="border-2 border-[#35b308]"
        />
      </div>

      <Button
        type="button"
        onClick={addStep}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Step
      </Button>
    </div>

    {steps.length > 0 && (
      <div className="mt-3 flex-1 overflow-y-auto border-t pt-2 space-y-2 scroll-smooth scrollbar-hide">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-background border rounded-lg px-3 py-2"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />

            <div className="flex-1 text-sm">
              <span className="font-bold">
                {step.stepNumber}. {step.title}
              </span>

              {step.description && (
                <p className="text-muted-foreground text-xs mt-0.5">
                  {step.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeStep(i)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5 text-white rounded-xl p-1 bg-[#e96262] hover:bg-[#ee0606]" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

<div className="border rounded-xl overflow-visible">
  <div className="bg-muted/60 px-4 py-3 border-b">
    <h2 className="text-sm font-semibold">Curated Products</h2>
  </div>

  <div className="p-4 h-[250px] flex flex-col">
    <div className="relative">
      <Input
        value={productSearch}
        onChange={(e) => setProductSearch(e.target.value)}
        placeholder="Search products by name..."
        className="border-2 border-[#35b308]"
      />

      {searchResults.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => addProduct(p)}
              className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted text-left"
            >
              <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden bg-muted">
                {p.image && (
                  <Image src={p.image} alt={p.name} fill className="object-cover" />
                )}
              </div>

              <span className="text-sm">{p.name}</span>

              <span className="text-xs text-muted-foreground ml-auto">
                ₹{p.price}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>

    {selectedProducts.length > 0 && (
      <div className="mt-3 flex-1 overflow-y-auto border-t pt-2 space-y-2 scroll-smooth scrollbar-hide">
        {selectedProducts.map((p) => (
          <div
            key={p._id}
            className="flex items-center gap-3 bg-background border rounded-lg px-3 py-2"
          >
            <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden bg-muted">
              {p.image && (
                <Image src={p.image} alt={p.name} fill className="object-cover" />
              )}
            </div>

            <span className="text-sm flex-1">{p.name}</span>

            <button
              type="button"
              onClick={() => removeProduct(p._id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5 text-white rounded-xl p-1 bg-[#e96262] hover:bg-[#ee0606]" />
            </button>
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

              <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Updating..." : "Update Ritual"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}