// app/admin/products/page.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Search, AlertTriangle, Package, RefreshCw, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Product {
  _id: string
  name: string
  price: number
  discountPrice?: number
  image: string
  stock: number
  isActive: boolean
  company: { name: string }
  category: { name: string }
}

export default function ProductsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const itemsPerPage = 12

  const [deleteStep, setDeleteStep] = useState<1 | 2 | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.replace("/auth/login")
      return
    }
    if (!session) return
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router])

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=1000&includeInactive=true")
      if (!res.ok) throw new Error("Failed to fetch products")
      const data = await res.json()
      setProducts(data.products || data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (product: Product) => {
    setTogglingId(product._id)
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (!res.ok) throw new Error("Failed to update product")
      await fetchProducts()
    } catch (error) {
      console.error("Error toggling product status:", error)
    } finally {
      setTogglingId(null)
    }
  }

  const promptDelete = (product: Product) => {
    setProductToDelete(product)
    setDeleteStep(1)
  }

  const handleFirstConfirm = () => setDeleteStep(2)

  const handleFinalConfirm = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${productToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete product")
      await fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
    } finally {
      setDeleting(false)
      setDeleteStep(null)
      setProductToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteStep(null)
    setProductToDelete(null)
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.company?.name?.toLowerCase().includes(query) ||
        product.category?.name?.toLowerCase().includes(query)
      const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name)
    })
    return Array.from(set).sort()
  }, [products])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading products...
        </div>
      </main>
    )
  }

  if (status === "unauthenticated") return null

  const activeCount = products.filter((p) => p.isActive).length
  const outOfStockCount = products.filter((p) => p.stock <= 0).length

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your product catalog</p>
            </div>
          </div>
          <Link href="/admin/products/add">
            <Button className="bg-emerald-700 hover:bg-emerald-800">
              <Plus className="w-4 h-4 mr-2" />
              Add product
            </Button>
          </Link>
        </div>

        {/* ── Stats row ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total products", value: products.length, dot: "bg-gray-400", color: "text-gray-900" },
            { label: "Active", value: activeCount, dot: "bg-emerald-500", color: "text-emerald-700" },
            { label: "Inactive", value: products.length - activeCount, dot: "bg-amber-500", color: "text-amber-700" },
            { label: "Out of stock", value: outOfStockCount, dot: "bg-red-500", color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Table card ───────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, company, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 w-full sm:w-56 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                  <th className="py-3 px-6 w-16">Image</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3 hidden md:table-cell">Company</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">No products found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search or filter.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr
                      key={product._id}
                      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${!product.isActive ? "opacity-60" : ""}`}
                    >
                      <td className="py-3 px-6">
                        <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No image</div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 line-clamp-2">{product.name}</span>
                          {!product.isActive && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-300 hidden sm:block mt-0.5">ID: {product._id}</div>
                      </td>

                      <td className="py-3.5 px-3 hidden md:table-cell align-top text-sm text-gray-600">{product.company?.name}</td>
                      <td className="py-3.5 px-3 hidden lg:table-cell align-top text-sm text-gray-600">{product.category?.name}</td>

                      <td className="py-3.5 px-3 align-top">
                        <div className="font-semibold text-sm text-gray-900">₹{product.discountPrice || product.price}</div>
                        {product.discountPrice && (
                          <div className="text-xs line-through text-gray-400">₹{product.price}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 align-top text-sm">
                        <span className={product.stock <= 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
                          {product.stock}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 align-top">
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className={product.isActive
                              ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"}
                            onClick={() => handleToggleActive(product)}
                            disabled={togglingId === product._id}
                          >
                            {togglingId === product._id ? "..." : product.isActive ? "Deactivate" : "Activate"}
                          </Button>

                          <Link href={`/admin/products/edit/${product._id}`}>
                            <Button size="sm" variant="outline" className="border-gray-200 text-gray-600 hover:text-emerald-700">
                              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                              Edit
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={() => promptDelete(product)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="border-gray-200"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="border-gray-200"
                >
                  Next
                </Button>
              </div>
              <div className="text-xs text-gray-400">
                Showing {startIdx + 1}–{Math.min(startIdx + itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 1: First confirmation dialog ────────────── */}
      <Dialog open={deleteStep === 1} onOpenChange={(open) => { if (!open) handleCancelDelete() }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-gray-900">Delete product?</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 pt-1">
              You are about to delete{" "}
              <span className="font-semibold text-gray-900">{productToDelete?.name}</span>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleFirstConfirm}>
              Yes, delete it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Step 2: Final confirmation dialog ────────────── */}
      <Dialog open={deleteStep === 2} onOpenChange={(open) => { if (!open) handleCancelDelete() }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-red-600">Are you absolutely sure?</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 pt-1">
              This will <span className="font-semibold text-red-500">permanently delete</span>{" "}
              <span className="font-semibold text-gray-900">{productToDelete?.name}</span> from the database.
              There is no way to recover it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={handleCancelDelete} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleFinalConfirm}
              disabled={deleting}
              className="min-w-[120px] bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete forever"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}