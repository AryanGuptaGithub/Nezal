"use client"
// app/admin/rituals/page.tsx
//
// Admin list view for Rituals — mirrors app/admin/products/page.tsx's
// table layout and delete-confirmation pattern.

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

interface Ritual {
  _id: string
  name: string
  slug: string
  tagline: string
  heroImage: string
  sortOrder: number
  isActive: boolean
}

export default function AdminRitualsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Ritual | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.replace("/auth/login"); return }
    fetchRituals()
  }, [status])

  const fetchRituals = async () => {
    try {
      const res = await fetch("/api/rituals?all=true")
      const data = await res.json()
      setRituals(data.rituals || [])
    } catch (e) {
      console.error("Error fetching rituals:", e)
    } finally {
      setLoading(false)
    }
  }


  const handleToggleActive = async (ritual: Ritual) => {
  setTogglingId(ritual._id)
  try {
    const res = await fetch(`/api/rituals/${ritual.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ritual.isActive }),
    })
    if (!res.ok) throw new Error("Failed to toggle")
    await fetchRituals()
  } catch (e) {
    console.error("Error toggling ritual:", e)
  } finally {
    setTogglingId(null)
  }
}

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/rituals/${deleteTarget.slug}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await fetchRituals()
    } catch (e) {
      console.error("Error deleting ritual:", e)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading rituals...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Rituals Management</h1>
          <Link href="/admin/rituals/add">
            <Button><Plus className="w-4 h-4 mr-2" />Add Ritual</Button>
          </Link>
        </div>

        <Card>
          <CardHeader><CardTitle>All Rituals</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-3 px-2 w-16">Image</th>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Tagline</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rituals.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No rituals yet</td></tr>
                  ) : (
                    rituals.map((ritual) => (
                      <tr key={ritual._id} className="border-b hover:bg-muted/40 transition">
                        <td className="py-3 px-2">
                          <div className="w-16 h-12 relative rounded overflow-hidden bg-muted">
                            {ritual.heroImage ? (
                              <Image src={ritual.heroImage} alt={ritual.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-semibold">{ritual.name}</td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{ritual.tagline}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ritual.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {ritual.isActive ? "Active" : "Draft"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleToggleActive(ritual)}
      disabled={togglingId === ritual._id}
      className={ritual.isActive
        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
        : "border-green-300 text-green-700 hover:bg-green-50"}
    >
      {togglingId === ritual._id ? "..." : ritual.isActive ? "Deactivate" : "Activate"}
    </Button>
    <Link href={`/rituals/${ritual.slug}`} target="_blank">
      <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
    </Link>
    <Link href={`/admin/rituals/edit/${ritual.slug}`}>
      <Button size="sm" variant="outline"><Edit2 className="w-4 h-4" /></Button>
    </Link>
    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(ritual)}>
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
            <DialogTitle>Delete Ritual?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. This cannot be undone.
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