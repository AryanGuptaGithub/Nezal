// app/admin/products/page.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Search, Eye, AlertTriangle } from "lucide-react"
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
  const itemsPerPage = 12

  // ── Delete confirmation state ──────────────────────────
  // Step 1: first confirm dialog  |  Step 2: second confirm dialog
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
      const res = await fetch("/api/products?limit=1000")
      if (!res.ok) throw new Error("Failed to fetch products")
      const data = await res.json()
      setProducts(data.products || data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // ── Open first dialog ──────────────────────────────────
  const promptDelete = (product: Product) => {
    setProductToDelete(product)
    setDeleteStep(1)
  }

  // ── User confirmed step 1 → show step 2 ───────────────
  const handleFirstConfirm = () => {
    setDeleteStep(2)
  }

  // ── User confirmed step 2 → actually delete ────────────
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

  // ── Cancel / close either dialog ──────────────────────
  const handleCancelDelete = () => {
    setDeleteStep(null)
    setProductToDelete(null)
  }

  // ── Filtered + paginated products ─────────────────────
  const filteredProducts = useMemo(() => {
  const query = searchQuery.toLowerCase()
  return products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.company?.name?.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query)

    const matchesCategory =
      selectedCategory === "all" || product.category?.name === selectedCategory

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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading products...</p>
      </main>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/admin/products/add">
              <Button>Add Product</Button>
            </Link>
          </div>
        </div>

   
     


        <Card>
          <CardHeader className="flex justify-between items-center ">
            <CardTitle>All Products</CardTitle>
                      {/* Search + Category filter */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-4 ">
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search products by name, company, or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>

    <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      className="h-10 w-full sm:w-56 rounded-md border-2 border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="all">All Categories</option>
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  </div>

  <div className="text-sm text-muted-foreground">
    Showing {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
  </div>
</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-3 px-2 w-16">Image</th>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2 hidden md:table-cell">Company</th>
                    <th className="py-3 px-2 hidden lg:table-cell">Category</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Stock</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <tr key={product._id} className="border-b hover:bg-muted/40 transition">
                        <td className="py-3 px-2">
                          <div className="w-16 h-12 relative rounded overflow-hidden bg-muted">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={64}
                                height={48}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No image
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-2 align-top">
                          <div className="font-semibold line-clamp-2">{product.name}</div>
                          <div className="text-xs text-muted-foreground hidden sm:block">ID: {product._id}</div>
                        </td>

                        <td className="py-3 px-2 hidden md:table-cell align-top">{product.company?.name}</td>
                        <td className="py-3 px-2 hidden lg:table-cell align-top">{product.category?.name}</td>

                        <td className="py-3 px-2 align-top">
                          <div className="font-bold">₹{product.discountPrice || product.price}</div>
                          {product.discountPrice && (
                            <div className="text-xs line-through text-muted-foreground">₹{product.price}</div>
                          )}
                        </td>

                        <td className="py-3 px-2 align-top text-sm text-muted-foreground">{product.stock}</td>

                        <td className="py-3 px-2 align-top">
                          <div className="flex gap-2 flex-wrap">
                            <Link
                              href={`/shop/${product.company?.name?.toLowerCase().replace(/\s+/g, "-")}/product/${product._id}`}
                              className="flex-1"
                            >
                              <Button size="sm" variant="ghost" className="w-full justify-start bg-[#dcd8d8]">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>

                            <Link href={`/admin/products/edit/${product._id}`} className="flex-1">
                              <Button size="sm" variant="outline" className="w-full justify-start">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full border-red-500 border hover:bg-[#eb2c2c] hover:text-white text-red-500"
                              onClick={() => promptDelete(product)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
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
              <div className="flex items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {startIdx + 1} – {Math.min(startIdx + itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Step 1: First confirmation dialog ────────────── */}
      <Dialog open={deleteStep === 1} onOpenChange={(open) => { if (!open) handleCancelDelete() }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">Delete Product?</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              You are about to delete{" "}
              <span className="font-semibold text-foreground">{productToDelete?.name}</span>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" className="bg-[#e61d1d] hover:bg-[#450909]"  onClick={handleFirstConfirm}>
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
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-red-600">Are you absolutely sure?</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              This will <span className="font-semibold text-red-500">permanently delete</span>{" "}
              <span className="font-semibold text-foreground">{productToDelete?.name}</span> from the database.
              There is no way to recover it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={handleCancelDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFinalConfirm}
              disabled={deleting}
              className="min-w-[120px] bg-[#e61d1d] hover:bg-[#450909]"
            >
              {deleting ? "Deleting..." : "Delete Forever"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}