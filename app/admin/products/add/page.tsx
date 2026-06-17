// app/admin/products/add/page.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, X, Upload, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { invalidateCache } from "@/lib/cacheClient"

import QuickPasteBox from "@/components/QuickPasteBox"
import { ParsedProductData } from "@/lib/parseQuickPaste"

interface Company { _id: string; name: string }
interface Category {
  _id: string; name: string; slug: string
  parent?: { name: string; slug: string; _id?: string }
  subCategories?: Category[]
  company?: string
}
interface Size {
  size: string; unit: "ml" | "l" | "g" | "kg"
  quantity: number; price: number; discountPrice?: number; stock: number; sku?: string
}
interface KeyIngredient { name: string; benefit: string }

function normalizeTextarea(val: string): string[] {
  return val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
}

export default function AddProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [companies, setCompanies] = useState<Company[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingResult, setUploadingResult] = useState(false)
  const [message, setMessage] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [formData, setFormData] = useState({
    name: "", slug: "", description: "",
    price: "", discountPrice: "",
    category: "", mainCategory: "", company: "",
    stock: "", sku: "",
    ingredients: "", benefits: "", usage: "", suitableFor: "",
    isActive: true,
    // ── New structured section fields ──
    whyYoullLoveIt: "",
    fragranceExp: "",
    whoIsItFor: "",
    skinHairConcern: "",
    expectedResults: "",
  })
  const [keyIngredients, setKeyIngredients] = useState<KeyIngredient[]>([])
  const [keyIngInput, setKeyIngInput] = useState<KeyIngredient>({ name: "", benefit: "" })
  const [results, setResults] = useState<Array<{ image: string; title: string; text: string }>>([])
  const [resultInput, setResultInput] = useState({ image: "", title: "", text: "" })
  const [resultImageUrl, setResultImageUrl] = useState("")
  const [sizes, setSizes] = useState<Size[]>([])
  const [sizeInput, setSizeInput] = useState<Size>({ size: "", unit: "ml", quantity: 0, price: 0, discountPrice: 0, stock: 0, sku: "" })

  useEffect(() => {
    if (!session) { router.push("/auth/login"); return }
    fetchCompanies()
  }, [session, router])

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies")
      const data = res.ok ? await res.json() : []
      setCompanies(data)
    } catch { setCompanies([]) }
  }

  const fetchCategoriesForCompany = async (companyId: string) => {
    try {
      const res = await fetch(`/api/categories?company=${companyId}`)
      const data = res.ok ? await res.json() : []
      setCategories(data)
      setFormData((prev) => ({ ...prev, mainCategory: "", category: "" }))
    } catch { setCategories([]) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (name === "company" && value) fetchCategoriesForCompany(value)
    if (name === "mainCategory") { setFormData((prev) => ({ ...prev, mainCategory: value, category: "" })); return }
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }))
  }


  const handleQuickPasteApply = (parsed: ParsedProductData) => {
  setFormData((prev) => ({
    ...prev,
    ...(parsed.name !== undefined && { name: parsed.name }),
    ...(parsed.slug !== undefined && { slug: parsed.slug }),
    ...(parsed.price !== undefined && { price: parsed.price }),
    ...(parsed.discountPrice !== undefined && { discountPrice: parsed.discountPrice }),
    ...(parsed.stock !== undefined && { stock: parsed.stock }),
    ...(parsed.sku !== undefined && { sku: parsed.sku }),
    ...(parsed.description !== undefined && { description: parsed.description }),
    ...(parsed.ingredients !== undefined && { ingredients: parsed.ingredients }),
    ...(parsed.benefits !== undefined && { benefits: parsed.benefits }),
    ...(parsed.usage !== undefined && { usage: parsed.usage }),
    ...(parsed.suitableFor !== undefined && { suitableFor: parsed.suitableFor }),
    ...(parsed.whyYoullLoveIt !== undefined && { whyYoullLoveIt: parsed.whyYoullLoveIt }),
    ...(parsed.fragranceExp !== undefined && { fragranceExp: parsed.fragranceExp }),
    ...(parsed.whoIsItFor !== undefined && { whoIsItFor: parsed.whoIsItFor }),
    ...(parsed.skinHairConcern !== undefined && { skinHairConcern: parsed.skinHairConcern }),
    ...(parsed.expectedResults !== undefined && { expectedResults: parsed.expectedResults }),
  }))

  // keyIngredients is a separate array of objects, not part of formData in the add page,
  // and is formData.keyIngredients (array) in the edit page — handle accordingly:

  // ── ADD PAGE: keyIngredients lives in its own `keyIngredients` state ──
  if (parsed.keyIngredients?.length) {
    setKeyIngredients((prev) => [...prev, ...parsed.keyIngredients!])
  }

  // ── EDIT PAGE (use this version instead, since keyIngredients is inside formData): ──
  // if (parsed.keyIngredients?.length) {
  //   setFormData((prev) => ({
  //     ...prev,
  //     keyIngredients: [...prev.keyIngredients, ...parsed.keyIngredients!],
  //   }))
  // }
}


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach((file) => fd.append("files", file))
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setImageUrls((prev) => [...prev, ...data.urls])
    } catch { setMessage("Error uploading images.") }
    finally { setUploading(false); e.target.value = "" }
  }

  const removeImage = (index: number) => setImageUrls((prev) => prev.filter((_, i) => i !== index))

  const handleAddSize = () => {
    if (!sizeInput.size || sizeInput.quantity <= 0 || sizeInput.price <= 0) { setMessage("Please fill in all size fields."); return }
    setSizes((prev) => [...prev, { ...sizeInput }])
    setSizeInput({ size: "", unit: "ml", quantity: 0, price: 0, discountPrice: 0, stock: 0, sku: "" }); setMessage("")
  }
  const removeSize = (index: number) => setSizes((prev) => prev.filter((_, i) => i !== index))

  const handleResultFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return
    setUploadingResult(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach((file) => fd.append("files", file))
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.urls?.[0]) setResultImageUrl(data.urls[0])
    } catch { setMessage("Error uploading result image.") }
    finally { setUploadingResult(false); e.target.value = "" }
  }

  const addKeyIngredient = () => {
    if (!keyIngInput.name.trim() || !keyIngInput.benefit.trim()) { setMessage("Enter both ingredient name and benefit."); return }
    setKeyIngredients((prev) => [...prev, { ...keyIngInput }])
    setKeyIngInput({ name: "", benefit: "" }); setMessage("")
  }
  const removeKeyIngredient = (index: number) => setKeyIngredients((prev) => prev.filter((_, i) => i !== index))

  const selectedMainCat = categories.find((c) => c._id === formData.mainCategory)
  const hasSubCategories = (selectedMainCat?.subCategories?.length ?? 0) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrls.length === 0) { setMessage("Please add at least one image."); return }
    if (!formData.mainCategory) { setMessage("Please select a main category."); return }
    setLoading(true); setMessage("")
    try {
      const bodyData = {
        name: formData.name, slug: formData.slug, description: formData.description,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        image: imageUrls[0], images: imageUrls,
        category: formData.category || undefined,
        mainCategory: formData.mainCategory || undefined,
        company: formData.company, stock: Number(formData.stock), sku: formData.sku,
        ingredients: normalizeTextarea(formData.ingredients),
        benefits: normalizeTextarea(formData.benefits),
        suitableFor: normalizeTextarea(formData.suitableFor),
        usage: formData.usage, isActive: formData.isActive, results,
        sizes: sizes.map((s) => ({ ...s, quantity: Number(s.quantity), price: Number(s.price), discountPrice: s.discountPrice ? Number(s.discountPrice) : undefined, stock: Number(s.stock) })),
        // ── New structured fields ──
        whyYoullLoveIt: normalizeTextarea(formData.whyYoullLoveIt),
        fragranceExp: normalizeTextarea(formData.fragranceExp),
        whoIsItFor: formData.whoIsItFor,
        skinHairConcern: formData.skinHairConcern,
        expectedResults: formData.expectedResults,
        keyIngredients,
      }
      const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyData) })
      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || "Failed to create product")
      invalidateCache("suggested:products:")  // new product should appear in suggestions
setMessage("Product created successfully!")
setTimeout(() => router.push("/admin/products"), 1500)
    } catch (error) {
      setMessage("Error creating product. Please try again.")
      console.error("Error:", error)
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/products">
          <Button variant="ghost" className="mb-6 bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back to Products</Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Add New Product</h1>
        <div className="mb-6">
  <QuickPasteBox onApply={handleQuickPasteApply} />
</div>
        <Card>
          
          <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Product Name *</label><Input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter product name" className="bg-background border-border" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Slug</label><Input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="Auto-generated if empty" className="bg-background border-border" /></div>
              </div>

              {/* Company & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Company *</label>
                  <select name="company" value={formData.company} onChange={handleChange} required className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                    <option value="">Select Company</option>
                    {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Main Category *</label>
                  <select name="mainCategory" value={formData.mainCategory} onChange={handleChange} required disabled={!formData.company} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">{formData.company ? "Select Main Category" : "Select company first"}</option>
                    {categories.filter((c) => !c.parent).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Sub Category {hasSubCategories ? "*" : ""}</label>
                  <select name="category" value={formData.category} onChange={handleChange} required={hasSubCategories} disabled={!hasSubCategories} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">{hasSubCategories ? "Select Sub Category" : "No sub categories"}</option>
                    {selectedMainCat?.subCategories?.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                  </select>
                  {formData.mainCategory && !hasSubCategories && <p className="text-xs text-muted-foreground mt-1">Will save under: <strong>{selectedMainCat?.name}</strong></p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description (short intro text)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter product description" rows={4} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Price (₹) *</label><Input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="0" className="bg-background border-border" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Discount Price (₹)</label><Input type="number" name="discountPrice" value={formData.discountPrice} onChange={handleChange} placeholder="0" className="bg-background border-border" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Stock *</label><Input type="number" name="stock" value={formData.stock} onChange={handleChange} required placeholder="0" className="bg-background border-border" /></div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Images *</label>
                <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition">
                      <div className="text-center"><Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" /><p className="text-sm font-medium text-foreground">Upload from Machine</p><p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p></div>
                      <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Add Image URL</label>
                      <div className="flex gap-2">
                        <Input type="url" placeholder="https://example.com/image.jpg" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} className="bg-background border-border flex-1" />
                        <Button type="button" onClick={() => { if (imageUrlInput.trim()) { setImageUrls((prev) => [...prev, imageUrlInput.trim()]); setImageUrlInput("") } }} variant="outline">Add</Button>
                      </div>
                    </div>
                  </div>
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  {imageUrls.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Added Images ({imageUrls.length})</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="relative h-24 bg-muted rounded-lg overflow-hidden">
                              <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                              {index === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Main</div>}
                            </div>
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SKU */}
              <div><label className="block text-sm font-medium text-foreground mb-2">SKU</label><Input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU-001" className="bg-background border-border" /></div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-4">Product Sizes (Optional)</label>
                <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-3 pb-4 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-foreground mb-2">Size Name *</label><Input type="text" placeholder="e.g., 50ml" value={sizeInput.size} onChange={(e) => setSizeInput({ ...sizeInput, size: e.target.value })} className="bg-background border-border" /></div>
                      <div><label className="block text-sm font-medium text-foreground mb-2">Unit *</label><select value={sizeInput.unit} onChange={(e) => setSizeInput({ ...sizeInput, unit: e.target.value as "ml" | "l" | "g" | "kg" })} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"><option value="ml">ml</option><option value="l">l</option><option value="g">g</option><option value="kg">kg</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-foreground mb-2">Quantity *</label><Input type="number" placeholder="50" value={sizeInput.quantity || ""} onChange={(e) => setSizeInput({ ...sizeInput, quantity: Number(e.target.value) })} className="bg-background border-border" /></div>
                      <div><label className="block text-sm font-medium text-foreground mb-2">Price (₹) *</label><Input type="number" placeholder="0" value={sizeInput.price || ""} onChange={(e) => setSizeInput({ ...sizeInput, price: Number(e.target.value) })} className="bg-background border-border" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-foreground mb-2">Discount Price (₹)</label><Input type="number" placeholder="0" value={sizeInput.discountPrice || ""} onChange={(e) => setSizeInput({ ...sizeInput, discountPrice: Number(e.target.value) || 0 })} className="bg-background border-border" /></div>
                      <div><label className="block text-sm font-medium text-foreground mb-2">Stock *</label><Input type="number" placeholder="0" value={sizeInput.stock || ""} onChange={(e) => setSizeInput({ ...sizeInput, stock: Number(e.target.value) })} className="bg-background border-border" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-foreground mb-2">Size SKU (Optional)</label><Input type="text" placeholder="SKU-50ML" value={sizeInput.sku || ""} onChange={(e) => setSizeInput({ ...sizeInput, sku: e.target.value })} className="bg-background border-border" /></div>
                    <Button type="button" onClick={handleAddSize} variant="outline" className="w-full">Add Size</Button>
                  </div>
                  {sizes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Added Sizes ({sizes.length})</label>
                      <div className="space-y-2">
                        {sizes.map((size, index) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-background flex justify-between items-center">
                            <div><p className="font-medium text-sm">{size.size}</p><p className="text-xs text-muted-foreground">Qty: {size.quantity} {size.unit} | ₹{size.price}{size.discountPrice ? ` → ₹${size.discountPrice}` : ""} | Stock: {size.stock}</p></div>
                            <button type="button" onClick={() => removeSize(index)} className="ml-2 bg-destructive text-destructive-foreground p-1.5 rounded hover:bg-destructive/80 transition"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredients & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Ingredients (one per line)</label><textarea name="ingredients" value={formData.ingredients} onChange={handleChange} placeholder={"Aloe Vera\nShea Butter\nKojic Acid"} rows={4} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Benefits (one per line)</label><textarea name="benefits" value={formData.benefits} onChange={handleChange} placeholder={"Moisturizes skin\nReduces dark spots"} rows={4} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" /></div>
              </div>

              {/* Usage */}
              <div><label className="block text-sm font-medium text-foreground mb-2">Usage Instructions</label><textarea name="usage" value={formData.usage} onChange={handleChange} placeholder="Enter usage instructions" rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" /></div>

              {/* ══════════════════════════════════════════════════ */}
              {/* PRODUCT DETAIL SECTIONS                           */}
              {/* ══════════════════════════════════════════════════ */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Product Detail Sections</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">These appear on the product page below the name</p>
                </div>
                <div className="p-4 space-y-6">

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Why You'll Love It <span className="text-muted-foreground font-normal">(one point per line)</span></label>
                    <textarea name="whyYoullLoveIt" value={formData.whyYoullLoveIt} onChange={handleChange} placeholder={"Refreshing cooling sensation for oily skin\nHelps maintain skin freshness all day\nPremium handmade soap with botanical extracts"} rows={4} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Suitable For <span className="text-muted-foreground font-normal">(one per line — shown as pills)</span></label>
                    <textarea name="suitableFor" value={formData.suitableFor} onChange={handleChange} placeholder={"Oily Skin\nCombination Skin\nAcne-Prone Skin"} rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Fragrance Experience <span className="text-muted-foreground font-normal">(one per line — shown as pills)</span></label>
                    <textarea name="fragranceExp" value={formData.fragranceExp} onChange={handleChange} placeholder={"Cool\nFresh\nRevitalizing"} rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Who Is This For?</label>
                    <textarea name="whoIsItFor" value={formData.whoIsItFor} onChange={handleChange} placeholder="e.g. Oily skin, combination skin, and acne-prone skin seeking cooling freshness." rows={2} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Skin / Hair Concern It Addresses</label>
                    <textarea name="skinHairConcern" value={formData.skinHairConcern} onChange={handleChange} placeholder="e.g. Excess oil, skin imbalance, clogged pores, and warm-weather skin fatigue." rows={2} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">What Results To Expect</label>
                    <textarea name="expectedResults" value={formData.expectedResults} onChange={handleChange} placeholder="e.g. Skin feels purified, cool, and balanced after each wash." rows={2} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">How Key Ingredients Help</label>
                    <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className="block text-xs text-muted-foreground mb-1">Ingredient Name</label><Input placeholder="e.g. Peppermint Essential Oil" value={keyIngInput.name} onChange={(e) => setKeyIngInput((prev) => ({ ...prev, name: e.target.value }))} className="bg-background border-border text-sm" /></div>
                        <div><label className="block text-xs text-muted-foreground mb-1">Benefit</label><Input placeholder="e.g. Cooling and oil-control skin care" value={keyIngInput.benefit} onChange={(e) => setKeyIngInput((prev) => ({ ...prev, benefit: e.target.value }))} className="bg-background border-border text-sm" /></div>
                      </div>
                      <Button type="button" onClick={addKeyIngredient} variant="outline" size="sm" className="w-full"><Plus className="w-4 h-4 mr-1" />Add Ingredient</Button>
                      {keyIngredients.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          {keyIngredients.map((ing, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 bg-background border border-border rounded-lg px-3 py-2">
                              <div className="text-sm flex-1"><span className="font-medium text-foreground">{ing.name}</span><span className="text-muted-foreground"> — {ing.benefit}</span></div>
                              <button type="button" onClick={() => removeKeyIngredient(i)} className="text-muted-foreground hover:text-destructive transition shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Results */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-4">Product Results</label>
                <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-3 pb-4 border-b border-border">
                    <div><label className="block text-sm font-medium text-foreground mb-2">Result Title</label><Input type="text" placeholder="e.g., Brightening Results" value={resultInput.title} onChange={(e) => setResultInput({ ...resultInput, title: e.target.value })} className="bg-background border-border" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-2">Result Description</label><textarea placeholder="Describe the result" value={resultInput.text} onChange={(e) => setResultInput({ ...resultInput, text: e.target.value })} rows={2} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" /></div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Result Image</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input type="url" placeholder="https://example.com/image.jpg" value={resultImageUrl} onChange={(e) => setResultImageUrl(e.target.value)} className="bg-background border-border flex-1" />
                          <Button type="button" onClick={() => { if (!resultInput.title.trim()) { setMessage("Please enter a result title."); return } setResults([...results, { image: resultImageUrl.trim(), title: resultInput.title, text: resultInput.text }]); setResultInput({ image: "", title: "", text: "" }); setResultImageUrl(""); setMessage("") }} variant="outline">Add Result</Button>
                        </div>
                        {resultImageUrl && <div className="relative h-20 w-32 rounded overflow-hidden"><Image src={resultImageUrl} alt="Result preview" fill className="object-cover" /></div>}
                        <label className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition">
                          <div className="text-center"><Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /><p className="text-xs font-medium text-foreground">Upload Image</p></div>
                          <input type="file" accept="image/*" onChange={handleResultFileUpload} disabled={uploadingResult} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                  {results.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Added Results ({results.length})</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {results.map((result, index) => (
                          <div key={index} className="relative group border border-border rounded-lg p-3 bg-background">
                            {result.image && <div className="relative h-24 bg-muted rounded mb-2 overflow-hidden"><Image src={result.image} alt={result.title} fill className="object-cover" /></div>}
                            <h4 className="font-medium text-sm text-foreground">{result.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{result.text}</p>
                            <button type="button" onClick={() => setResults(results.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4" />
                <label className="text-sm font-medium text-foreground">Active</label>
              </div>

              {message && (
                <div className={`p-3 rounded text-sm ${message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message}</div>
              )}

              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : "Create Product"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}