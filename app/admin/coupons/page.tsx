"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Ticket, Plus, Trash2, Edit2, RefreshCw, X, Check } from "lucide-react"

/* ─── Types ──────────────────────────────────────────────── */

interface Coupon {
  _id: string
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
  maxUses: number
  usedCount: number
  startsAt: string | null
  expiresAt: string | null
  minOrderValue: number
  isActive: boolean
  createdAt: string
}

/* ─── Helpers ────────────────────────────────────────────── */

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getStatus(coupon: Coupon): { label: string; color: string } {
  if (!coupon.isActive) return { label: "Disabled", color: "bg-gray-100 text-gray-500" }
  if (coupon.usedCount >= coupon.maxUses) return { label: "Exhausted", color: "bg-red-100 text-red-600" }
  const now = new Date()
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return { label: "Expired", color: "bg-gray-100 text-gray-500" }
  return { label: "Active", color: "bg-green-100 text-green-700" }
}

const EMPTY_FORM = {
  code: "",
  discountType: "percentage" as "percentage" | "flat",
  discountValue: "",
  maxUses: "",
  minOrderValue: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
}

/* ─── Coupon Form Modal ──────────────────────────────────── */

function CouponFormModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing: Coupon | null
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
        discountType: editing.discountType,
        discountValue: String(editing.discountValue),
        maxUses: String(editing.maxUses),
        minOrderValue: String(editing.minOrderValue || ""),
        startsAt: editing.startsAt ? toLocalInputValue(new Date(editing.startsAt)) : "",
        expiresAt: editing.expiresAt ? toLocalInputValue(new Date(editing.expiresAt)) : "",
        isActive: editing.isActive,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError("")
  }, [editing, open])

  const set = (key: keyof typeof EMPTY_FORM, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) { setError("Code is required."); return }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setError("Discount value must be greater than 0."); return }
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) { setError("Percentage can't exceed 100."); return }
    if (!form.maxUses || Number(form.maxUses) < 1) { setError("Max uses must be at least 1."); return }
    if (form.startsAt && form.expiresAt && new Date(form.expiresAt) <= new Date(form.startsAt)) {
      setError("Expiry must be after start date."); return
    }

    setSubmitting(true); setError("")
    try {
      const url = editing ? `/api/coupons/${editing._id}` : "/api/coupons"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxUses: Number(form.maxUses),
          minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          isActive: form.isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the coupon details below." : "Fill in the details to create a new coupon code."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Coupon Code *</label>
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. NEZAL25"
              className="uppercase font-mono"
              disabled={!!editing}  // can't change code after creation
            />
            {editing && <p className="text-xs text-muted-foreground mt-1">Code cannot be changed after creation.</p>}
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Discount Type *</label>
              <div className="flex rounded-xl overflow-hidden border">
                {(["percentage", "flat"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("discountType", t)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      form.discountType === t
                        ? "bg-foreground text-background"
                        : "hover:bg-muted"
                    }`}
                  >
                    {t === "percentage" ? "% Off" : "₹ Flat"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Value * {form.discountType === "percentage" ? "(%)" : "(₹)"}
              </label>
              <Input
                type="number"
                min={1}
                max={form.discountType === "percentage" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
              />
            </div>
          </div>

          {/* Max uses + min order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Uses *</label>
              <Input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => set("maxUses", e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Min Order Value (₹)</label>
              <Input
                type="number"
                min={0}
                value={form.minOrderValue}
                onChange={(e) => set("minOrderValue", e.target.value)}
                placeholder="e.g. 499 (optional)"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Starts At (optional)</label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Expires At (optional)</label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium">Active</label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Page ───────────────────────────────────────────────── */

export default function AdminCouponsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login")
    if (status === "authenticated") fetchCoupons()
  }, [status])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/coupons")
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch (e) {
      console.error("Error fetching coupons:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/coupons/${deleteTarget._id}`, { method: "DELETE" })
      await fetchCoupons()
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (c: Coupon) => { setEditing(c); setFormOpen(true) }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading coupons...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="w-7 h-7 text-[var(--color-brand-primary)]" />
            Coupons
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCoupons}
              className="p-2 rounded-xl border hover:bg-muted transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Create Coupon
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: coupons.length, color: "#1e3a28" },
            { label: "Active", value: coupons.filter((c) => getStatus(c).label === "Active").length, color: "#1e6636" },
            { label: "Exhausted", value: coupons.filter((c) => getStatus(c).label === "Exhausted").length, color: "#c0392b" },
            { label: "Disabled", value: coupons.filter((c) => !c.isActive).length, color: "#6b7c70" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border p-4 text-center">
              <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>All Coupons</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Uses</th>
                    <th className="py-3 px-3">Min Order</th>
                    <th className="py-3 px-3">Validity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No coupons yet. Create your first one!
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => {
                      const st = getStatus(coupon)
                      return (
                        <tr key={coupon._id} className="border-b hover:bg-muted/40 transition">

                          {/* Code */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded-lg">
                              {coupon.code}
                            </span>
                          </td>

                          {/* Discount */}
                          <td className="py-3 px-3 font-bold text-amber-600">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}% off`
                              : `₹${coupon.discountValue} off`}
                          </td>

                          {/* Uses */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%`,
                                    backgroundColor: coupon.usedCount >= coupon.maxUses ? "#ef4444" : "#1e6636",
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {coupon.usedCount} / {coupon.maxUses}
                              </span>
                            </div>
                          </td>

                          {/* Min order */}
                          <td className="py-3 px-3 text-sm text-muted-foreground">
                            {coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue}` : "—"}
                          </td>

                          {/* Validity */}
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {coupon.startsAt || coupon.expiresAt ? (
                              <>
                                {coupon.startsAt
                                  ? new Date(coupon.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                                  : "Always"}
                                {" → "}
                                {coupon.expiresAt
                                  ? new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                                  : "No expiry"}
                              </>
                            ) : (
                              "No expiry"
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${st.color}`}>
                              {st.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEdit(coupon)}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(coupon)}>
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit modal */}
      <CouponFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchCoupons}
        editing={editing}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Coupon?</DialogTitle>
            <DialogDescription>
              This will permanently delete coupon{" "}
              <strong className="font-mono">{deleteTarget?.code}</strong>.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}