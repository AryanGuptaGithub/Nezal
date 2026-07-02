"use client"
// app/admin/concerns/page.tsx
//
// Admin list view for Concerns — mirrors app/admin/rituals/page.tsx.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Eye, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Concern {
  _id: string
  label: string
  slug: string
  heroImage: string
  sortOrder: number
  isActive: boolean
}

export default function AdminConcernsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [concerns, setConcerns] = useState<Concern[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Concern | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)


  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.replace("/auth/login"); return }
    fetchConcerns()
  }, [status])

  const fetchConcerns = async () => {
    try {
      const res = await fetch("/api/concerns?all=true")
      const data = await res.json()
      setConcerns(data.concerns || [])
    } catch (e) {
      console.error("Error fetching concerns:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/concerns/${deleteTarget.slug}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await fetchConcerns()
    } catch (e) {
      console.error("Error deleting concern:", e)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (concern: Concern) => {
  setTogglingId(concern._id)
  try {
    const res = await fetch(`/api/concerns/${concern.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !concern.isActive }),
    })
    if (!res.ok) throw new Error("Failed to toggle")
    await fetchConcerns()
  } catch (e) {
    console.error("Error toggling concern:", e)
  } finally {
    setTogglingId(null)
  }
}

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading concerns...</p>
      </main>
    )
  }



  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Concerns Management</h1>
          <Link href="/admin/concerns/add">
            <Button><Plus className="w-4 h-4 mr-2" />Add Concern</Button>
          </Link>
        </div>

        <Card>
          <CardHeader><CardTitle>All Concerns</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-3 px-2 w-16">Image</th>
                    <th className="py-3 px-2">Label</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {concerns.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No concerns yet</td></tr>
                  ) : (
                    concerns.map((concern) => (
                      <tr key={concern._id} className="border-b hover:bg-muted/40 transition">
                        <td className="py-3 px-2">
                          <div className="w-16 h-12 relative rounded overflow-hidden bg-muted">
                            {concern.heroImage ? (
                              <Image src={concern.heroImage} alt={concern.label} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-semibold">{concern.label}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${concern.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {concern.isActive ? "Active" : "Draft"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleToggleActive(concern)}
      disabled={togglingId === concern._id}
      className={concern.isActive
        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
        : "border-green-300 text-green-700 hover:bg-green-50"}
    >
      {togglingId === concern._id ? "..." : concern.isActive ? "Deactivate" : "Activate"}
    </Button>
    <Link href={`/concerns/${concern.slug}`} target="_blank">
      <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
    </Link>
    <Link href={`/admin/concerns/edit/${concern.slug}`}>
      <Button size="sm" variant="outline"><Edit2 className="w-4 h-4" /></Button>
    </Link>
    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(concern)}>
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
</td>
                      </tr>
                    ))
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
            <DialogTitle>Delete Concern?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.label}</strong>. This cannot be undone.
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