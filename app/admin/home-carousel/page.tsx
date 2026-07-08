"use client"
// app/admin/home-carousel/page.tsx

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUploadField } from "@/components/admin/image-upload-field"
import { Loader2, Trash2, ArrowUp, ArrowDown, Pencil, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Banner {
  _id: string
  url: string
  title?: string
  description?: string
  linkType: "product" | "collection" | "custom" | "none"
  link?: string
  linkLabel?: string
  order: number
  isActive: boolean
}

interface ProductResult {
  _id: string
  name: string
  slug: string
  image?: string
  company?: { _id: string; name: string; slug: string }
}

interface Collection {
  _id: string
  name: string
  slug: string
}

const emptyForm = {
  url: "",
  title: "",
  description: "",
  linkType: "none" as Banner["linkType"],
  link: "",
  linkLabel: "",
  isActive: true,
}

export default function HomeCarouselAdminPage() {
  const { toast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Product picker state
  const [productQuery, setProductQuery] = useState("")
  const [productResults, setProductResults] = useState<ProductResult[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)

  // Collection picker state
  const [collections, setCollections] = useState<Collection[]>([])

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/home-carousel")
      const data = await res.json()
      console.log(data);
      setBanners(Array.isArray(data) ? data.sort((a: Banner, b: Banner) => a.order - b.order) : [])
    } catch (err) {
      toast({ title: "Failed to load banners", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // Note: GET /api/home-carousel only returns isActive banners for the public
  // homepage. For admin management we want ALL banners (active + inactive).
  // See note below the component for the one-line backend tweak needed,
  // or swap this fetch to a dedicated admin endpoint if you prefer to keep
  // the public route untouched.

  useEffect(() => {
    if (form.linkType !== "collection") return
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => setCollections(Array.isArray(data) ? data : data.collections || []))
      .catch(() => setCollections([]))
  }, [form.linkType])

  // Debounced product search
  useEffect(() => {
    if (form.linkType !== "product") return
    const handle = setTimeout(async () => {
      setSearchingProducts(true)
      try {
        const res = await fetch(`/api/admin/home-carousel/search-products?q=${encodeURIComponent(productQuery)}`)
        const data = await res.json()
        setProductResults(Array.isArray(data) ? data : [])
      } catch {
        setProductResults([])
      } finally {
        setSearchingProducts(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [productQuery, form.linkType])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setProductQuery("")
    setProductResults([])
  }

  const startEdit = (banner: Banner) => {
    setEditingId(banner._id)
    setForm({
      url: banner.url,
      title: banner.title || "",
      description: banner.description || "",
      linkType: banner.linkType || "none",
      link: banner.link || "",
      linkLabel: banner.linkLabel || "",
      isActive: banner.isActive,
    })
  }

  const handleSelectProduct = (product: ProductResult) => {
    const companySlug = product.company?.slug || "nezal"
    setForm((f) => ({
      ...f,
      link: `/shop/${companySlug}/product/${product._id}`,
      linkLabel: `Product: ${product.name}`,
    }))
    setProductResults([])
    setProductQuery(product.name)
  }

  const handleSelectCollection = (slug: string) => {
    const collection = collections.find((c) => c.slug === slug)
    setForm((f) => ({
      ...f,
      link: `/collections/${slug}`,
      linkLabel: collection ? `Collection: ${collection.name}` : `Collection: ${slug}`,
    }))
  }

  const handleSubmit = async () => {
    if (!form.url) {
      toast({ title: "An image is required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = {
        url: form.url,
        title: form.title,
        description: form.description,
        linkType: form.linkType,
        link: form.linkType === "none" ? "" : form.link,
        linkLabel: form.linkType === "none" ? "" : form.linkLabel,
        isActive: form.isActive,
      }

      const res = await fetch(
        editingId ? `/api/home-carousel/${editingId}` : "/api/home-carousel",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Save failed")
      }

      toast({ title: editingId ? "Banner updated" : "Banner added" })
      resetForm()
      fetchBanners()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Save failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/home-carousel/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast({ title: "Banner deleted" })
      fetchBanners()
    } catch {
      toast({ title: "Failed to delete banner", variant: "destructive" })
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      await fetch(`/api/home-carousel/${banner._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      })
      fetchBanners()
    } catch {
      toast({ title: "Failed to update banner", variant: "destructive" })
    }
  }

  const moveBanner = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= banners.length) return

    const reordered = [...banners]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setBanners(reordered)

    try {
      await fetch("/api/home-carousel/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: reordered.map((b, i) => ({ id: b._id, order: i })),
        }),
      })
    } catch {
      toast({ title: "Failed to save order", variant: "destructive" })
      fetchBanners()
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Home Carousel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the hero banners shown at the top of the homepage. Each banner can link to a
          product, a collection, a custom URL, or nothing at all.
        </p>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <div className="border rounded-xl p-5 space-y-5 bg-card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? "Edit Banner" : "Add New Banner"}</h2>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-4 h-4 mr-1" /> Cancel edit
            </Button>
          )}
        </div>

        <ImageUploadField
          label="Banner Image"
          value={form.url}
          onChange={(url) => setForm((f) => ({ ...f, url }))}
          folder="carousel"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Title (optional)</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Monsoon Skincare Sale"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Up to 30% off"
            />
          </div>
        </div>

        <div>
          <Label>Link this banner to</Label>
          <Select
            value={form.linkType}
            onValueChange={(v: Banner["linkType"]) =>
              setForm((f) => ({ ...f, linkType: v, link: "", linkLabel: "" }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No link (image only)</SelectItem>
              <SelectItem value="product">A product</SelectItem>
              <SelectItem value="collection">A collection</SelectItem>
              <SelectItem value="custom">Custom URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.linkType === "product" && (
          <div className="relative">
            <Label>Search products</Label>
            <Input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Type a product name..."
              className="mt-1"
            />
            {searchingProducts && (
              <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-9 text-muted-foreground" />
            )}
            {productResults.length > 0 && (
              <div className="mt-1 border rounded-lg max-h-56 overflow-y-auto bg-popover shadow-md">
                {productResults.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-3 text-sm"
                  >
                    {p.image && (
                      <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.company?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {form.linkLabel && (
              <p className="text-xs text-green-600 mt-1">Selected: {form.linkLabel}</p>
            )}
          </div>
        )}

        {form.linkType === "collection" && (
          <div>
            <Label>Select collection</Label>
            <Select onValueChange={handleSelectCollection}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c._id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.linkLabel && (
              <p className="text-xs text-green-600 mt-1">Selected: {form.linkLabel}</p>
            )}
          </div>
        )}

        {form.linkType === "custom" && (
          <div>
            <Label>Custom URL</Label>
            <Input
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value, linkLabel: e.target.value }))}
              placeholder="/shop or https://..."
              className="mt-1"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          <Label>Active (visible on homepage)</Label>
        </div>

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : editingId ? (
            "Update Banner"
          ) : (
            "Add Banner"
          )}
        </Button>
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold mb-3">Current Banners ({banners.length})</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : banners.length === 0 ? (
          <p className="text-sm text-muted-foreground">No banners yet — add one above.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, idx) => (
              <div
                key={banner._id}
                className={`flex items-center gap-4 border rounded-lg p-3 bg-card ${!banner.isActive ? "opacity-50" : ""}`}
              >
                <img src={banner.url} alt="" className="w-24 h-16 object-cover rounded border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{banner.title || "Untitled banner"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {banner.linkType === "none" ? "No link" : banner.linkLabel || banner.link}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => moveBanner(idx, -1)} disabled={idx === 0}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveBanner(idx, 1)} disabled={idx === banners.length - 1}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Switch checked={banner.isActive} onCheckedChange={() => handleToggleActive(banner)} />
                  <Button variant="ghost" size="icon" onClick={() => startEdit(banner)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(banner._id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}