"use client"
// app/admin/flash-sales/page.tsx

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Plus, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FlashSale {
  _id: string
  name: string
  discountPercent: number
  startsAt: string
  endsAt: string
  products: { _id: string; name: string }[]
  isActive: boolean
}

function getStatus(sale: FlashSale): { label: string; color: string } {
  const now = new Date()
  const start = new Date(sale.startsAt)
  const end = new Date(sale.endsAt)
  if (!sale.isActive) return { label: "Disabled", color: "bg-gray-100 text-gray-500" }
  if (now < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" }
  if (now > end) return { label: "Ended", color: "bg-gray-100 text-gray-500" }
  return { label: "Live Now", color: "bg-green-100 text-green-700" }
}

export default function AdminFlashSalesPage() {
  const router = useRouter()
  const { status } = useSession()
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<FlashSale | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.replace("/auth/login"); return }
    fetchSales()
  }, [status])

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/flash-sales?all=true")
      const data = await res.json()
      setSales(data.sales || [])
    } catch (e) {
      console.error("Error fetching flash sales:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (sale: FlashSale) => {
  setTogglingId(sale._id)
  try {
    const res = await fetch(`/api/flash-sales/${sale._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !sale.isActive }),
    })
    if (!res.ok) throw new Error("Failed to toggle")
    await fetchSales()
  } catch (e) {
    console.error("Error toggling flash sale:", e)
  } finally {
    setTogglingId(null)
  }
}

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/flash-sales/${deleteTarget._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await fetchSales()
    } catch (e) {
      console.error("Error deleting flash sale:", e)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading flash sales...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-500" /> Flash Sales
          </h1>
          <Link href="/admin/flash-sales/add">
            <Button><Plus className="w-4 h-4 mr-2" />Create Flash Sale</Button>
          </Link>
        </div>

        <Card>
          <CardHeader><CardTitle>All Flash Sales</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Discount</th>
                    <th className="py-3 px-2">Products</th>
                    <th className="py-3 px-2">Window</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No flash sales yet</td></tr>
                  ) : (
                    sales.map((sale) => {
                      const status = getStatus(sale)
                      return (
                        <tr key={sale._id} className="border-b hover:bg-muted/40 transition">
                          <td className="py-3 px-2 font-semibold">{sale.name}</td>
                          <td className="py-3 px-2 font-bold text-amber-600">{sale.discountPercent}% off</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">{sale.products.length} product{sale.products.length !== 1 ? "s" : ""}</td>
                          <td className="py-3 px-2 text-xs text-muted-foreground">
                            {new Date(sale.startsAt).toLocaleDateString()} → {new Date(sale.endsAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                          </td>
                          <td className="py-3 px-2">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleToggleActive(sale)}
      disabled={togglingId === sale._id}
      className={sale.isActive
        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
        : "border-green-300 text-green-700 hover:bg-green-50"}
    >
      {togglingId === sale._id ? "..." : sale.isActive ? "Deactivate" : "Activate"}
    </Button>
    <Link href={`/admin/flash-sales/edit/${sale._id}`}>
      <Button size="sm" variant="outline"><Edit2 className="w-4 h-4" /></Button>
    </Link>
    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(sale)}>
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Flash Sale?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. Products will return to their normal price immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
