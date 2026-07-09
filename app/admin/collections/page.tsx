"use client"
// app/admin/collections/page.tsx

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, Leaf } from "lucide-react"

interface CollectionRow {
  _id: string
  name: string
  slug: string
  tagline?: string
  heroImage?: string
  navCategory: string
  subCategory: string
  sortOrder: number
  isActive: boolean
}

const NAV_CATEGORY_LABELS: Record<string, string> = {
  "face-care": "Face Care",
  "body-care": "Body Care",
  "hair-care": "Hair Care",
  "gift-kits": "Gift Kits",
}

const NAV_CATEGORY_ORDER = ["face-care", "body-care", "hair-care", "gift-kits"]

export default function AdminCollectionsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [dragSlug, setDragSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!session) { router.push("/auth/login"); return }
    fetchCollections()
  }, [session])

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/collections")
      const data = await res.json()
      setCollections(data.collections || [])
    } catch {
      setMessage("Error loading collections.")
    } finally {
      setLoading(false)
    }
  }

  const grouped = NAV_CATEGORY_ORDER.reduce<Record<string, CollectionRow[]>>((acc, cat) => {
    acc[cat] = collections.filter((c) => c.navCategory === cat).sort((a, b) => a.sortOrder - b.sortOrder)
    return acc
  }, {})

  const toggleActive = async (row: CollectionRow) => {
    setCollections((prev) => prev.map((c) => c.slug === row.slug ? { ...c, isActive: !c.isActive } : c))
    try {
      const res = await fetch(`/api/admin/collections/${row.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setMessage("Error updating status.")
      fetchCollections()
    }
  }

  const handleDelete = async (row: CollectionRow) => {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/collections/${row.slug}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setCollections((prev) => prev.filter((c) => c.slug !== row.slug))
      setMessage("Collection deleted.")
    } catch {
      setMessage("Error deleting collection.")
    }
  }

  // ── Drag reorder (scoped within a navCategory group) ──
  const handleDrop = async (cat: string, targetSlug: string) => {
    if (!dragSlug || dragSlug === targetSlug) return

    const group = [...grouped[cat]]
    const fromIdx = group.findIndex((c) => c.slug === dragSlug)
    const toIdx = group.findIndex((c) => c.slug === targetSlug)
    if (fromIdx === -1 || toIdx === -1) return

    const [moved] = group.splice(fromIdx, 1)
    group.splice(toIdx, 0, moved)
    const reordered = group.map((c, i) => ({ ...c, sortOrder: i }))

    setCollections((prev) => {
      const others = prev.filter((c) => c.navCategory !== cat)
      return [...others, ...reordered]
    })
    setDragSlug(null)

    try {
      await fetch("/api/admin/collections/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((c) => ({ slug: c.slug, sortOrder: c.sortOrder })) }),
      })
    } catch {
      setMessage("Error saving new order.")
      fetchCollections()
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading collections...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Collections</h1>
          <Link href="/admin/collections/add">
            <Button><Plus className="w-4 h-4 mr-2" />Add Collection</Button>
          </Link>
        </div>

        {message && <div className="mb-4 p-3 rounded text-sm bg-muted">{message}</div>}

        {collections.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            No collections yet. Create your first one.
          </CardContent></Card>
        ) : (
          <div className="space-y-8">
            {NAV_CATEGORY_ORDER.filter((cat) => grouped[cat]?.length > 0).map((cat) => (
              <Card key={cat}>
                <CardHeader><CardTitle className="text-base">{NAV_CATEGORY_LABELS[cat]}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {grouped[cat].map((row) => (
                    <div
                      key={row.slug}
                      draggable
                      onDragStart={() => setDragSlug(row.slug)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(cat, row.slug)}
                      className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-background cursor-move"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />

                      <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-muted">
                        {row.heroImage ? (
                          <Image src={row.heroImage} alt={row.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Leaf className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground truncate">/{row.slug} · {row.subCategory}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                          row.isActive ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </button>

                      <a
                        href={`/collections/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title="Preview on site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <Link href={`/admin/collections/edit/${row.slug}`} className="shrink-0">
                        <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}