"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, RefreshCw, FolderOpen, AlertTriangle, CheckSquare, XSquare, Cloud, HardDrive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ImageFile {
  path: string
  folder: string
  filename: string
  size: number
  isUsed: boolean
  usedBy: string[]
  storageType: "local" | "cloudinary"
}

export default function ImagesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeFolder, setActiveFolder] = useState<string>("all")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.replace("/auth/login")
      return
    }
    if (!session) return
    scanImages()
  }, [status, session, router])

  const scanImages = async () => {
    setScanning(true)
    setSelectedImages(new Set())
    try {
      const res = await fetch("/api/admin/images/scan")
      if (!res.ok) throw new Error("Failed to scan images")
      const data = await res.json()
      setImages(data.images || [])
    } catch (error) {
      console.error("Error scanning images:", error)
      toast({ title: "Error", description: "Failed to scan images", variant: "destructive" })
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }

  const deleteImage = async (imagePath: string) => {
    setDeleting(imagePath)
    try {
      const res = await fetch("/api/admin/images/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: imagePath }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete image")
      }
      toast({ title: "Success", description: "Image deleted successfully" })
      setImages(prev => prev.filter(img => img.path !== imagePath))
      setSelectedImages(prev => { const s = new Set(prev); s.delete(imagePath); return s })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete image", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  const bulkDeleteImages = async () => {
    setBulkDeleting(true)
    let successCount = 0
    let failCount = 0
    for (const imagePath of Array.from(selectedImages)) {
      try {
        const res = await fetch("/api/admin/images/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: imagePath }),
        })
        if (res.ok) {
          successCount++
          setImages(prev => prev.filter(img => img.path !== imagePath))
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    setBulkDeleting(false)
    setSelectedImages(new Set())
    setShowDeleteDialog(false)
    toast({
      title: successCount > 0 ? "Success" : "Error",
      description: `Deleted ${successCount} image(s).${failCount > 0 ? ` Failed: ${failCount}.` : ""}`,
      variant: successCount > 0 ? "default" : "destructive",
    })
  }

  const toggleImageSelection = (imagePath: string) => {
    setSelectedImages(prev => {
      const s = new Set(prev)
      s.has(imagePath) ? s.delete(imagePath) : s.add(imagePath)
      return s
    })
  }

  const selectAllInFolder = (folder: string, used: boolean) => {
    const folderImages = getFilteredImages(folder, used)
    const allPaths = folderImages.map(img => img.path)
    const allSelected = allPaths.every(p => selectedImages.has(p))
    setSelectedImages(prev => {
      const s = new Set(prev)
      allSelected ? allPaths.forEach(p => s.delete(p)) : allPaths.forEach(p => s.add(p))
      return s
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "—"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFolderColor = (folder: string) => {
    const colors: Record<string, string> = {
      arrivals: "bg-blue-100 text-blue-800 border-blue-200",
      "cloudinary/arrivals": "bg-blue-100 text-blue-800 border-blue-200",
      blogs: "bg-green-100 text-green-800 border-green-200",
      "cloudinary/blogs": "bg-green-100 text-green-800 border-green-200",
      carousel: "bg-purple-100 text-purple-800 border-purple-200",
      "cloudinary/carousel": "bg-purple-100 text-purple-800 border-purple-200",
      "shop-by-concern": "bg-orange-100 text-orange-800 border-orange-200",
      "cloudinary/shop-by-concern": "bg-orange-100 text-orange-800 border-orange-200",
      uploads: "bg-gray-100 text-gray-800 border-gray-200",
      "cloudinary/uploads": "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[folder] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getFolderLabel = (folder: string) =>
    folder.replace("cloudinary/", "").replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())

  // Normalise folder for tab grouping: "cloudinary/arrivals" → "arrivals"
  const normaliseFolder = (folder: string) => folder.replace("cloudinary/", "")

  const folders = Array.from(new Set(images.map(img => normaliseFolder(img.folder)))).sort()

  const getFilteredImages = (folder: string, used: boolean) =>
    images.filter(img =>
      (folder === "all" || normaliseFolder(img.folder) === folder) &&
      img.isUsed === used
    )

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    )
  }

  const usedImages = images.filter(img => img.isUsed)
  const unusedImages = images.filter(img => !img.isUsed)
  const cloudinaryCount = images.filter(img => img.storageType === "cloudinary").length
  const localCount = images.filter(img => img.storageType === "local").length
  const selectedUnusedCount = Array.from(selectedImages).filter(p => unusedImages.some(img => img.path === p)).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Image Management</h1>
          <p className="text-muted-foreground">Manage images across local storage and Cloudinary</p>
        </div>
        <div className="flex gap-2">
          {selectedImages.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={bulkDeleting}
              className="flex items-center gap-2"
            >
              {bulkDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Selected ({selectedImages.size})
            </Button>
          )}
          <Button onClick={scanImages} disabled={scanning} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Scan Images"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{images.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{usedImages.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unused (Local)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{unusedImages.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Cloud className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1">
                <Cloud className="w-3 h-3 text-blue-500" />
                <span className="font-semibold">{cloudinaryCount}</span>
                <span className="text-muted-foreground">Cloudinary</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-gray-500" />
                <span className="font-semibold">{localCount}</span>
                <span className="text-muted-foreground">Local</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Folder Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveFolder}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="all">All Folders</TabsTrigger>
          {folders.map(folder => (
            <TabsTrigger key={folder} value={folder}>
              {getFolderLabel(folder)}
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", ...folders].map(folder => (
          <TabsContent key={folder} value={folder} className="space-y-6">

            {/* Used Images */}
            {getFilteredImages(folder, true).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  Used Images ({getFilteredImages(folder, true).length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getFilteredImages(folder, true).map(image => (
                    <ImageCard key={image.path} image={image} formatFileSize={formatFileSize} getFolderColor={getFolderColor} getFolderLabel={getFolderLabel} />
                  ))}
                </div>
              </div>
            )}

            {/* Unused Images */}
            {getFilteredImages(folder, false).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Unused Images ({getFilteredImages(folder, false).length})
                    <Badge variant="outline" className="text-xs font-normal">Local only — safe to delete</Badge>
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllInFolder(folder, false)}
                    className="flex items-center gap-2"
                  >
                    {getFilteredImages(folder, false).every(img => selectedImages.has(img.path))
                      ? <><XSquare className="w-4 h-4" /> Deselect All</>
                      : <><CheckSquare className="w-4 h-4" /> Select All</>}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getFilteredImages(folder, false).map(image => (
                    <Card
                      key={image.path}
                      className={`overflow-hidden border-orange-200 relative ${selectedImages.has(image.path) ? "ring-2 ring-orange-500" : ""}`}
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedImages.has(image.path)}
                          onCheckedChange={() => toggleImageSelection(image.path)}
                          className="bg-white border-2"
                        />
                      </div>
                      <div className="aspect-square relative">
                        <img
                          src={image.path}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg" }}
                        />
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={getFolderColor(image.folder)}>{getFolderLabel(normaliseFolder(image.folder))}</Badge>
                          <Badge variant="destructive">Unused</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <HardDrive className="w-3 h-3" />
                          <span>Local</span>
                        </div>
                        <p className="text-sm font-medium truncate" title={image.filename}>{image.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full mt-2"
                          onClick={() => deleteImage(image.path)}
                          disabled={deleting === image.path}
                        >
                          {deleting === image.path
                            ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Deleting...</>
                            : <><Trash2 className="w-4 h-4 mr-2" />Delete</>}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {getFilteredImages(folder, true).length === 0 && getFilteredImages(folder, false).length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No images found</h3>
                <p className="text-muted-foreground">No images in this folder.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedImages.size} images?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Selected images will be permanently deleted.
              {selectedUnusedCount < selectedImages.size && (
                <div className="mt-2 text-orange-600 font-semibold">
                  Warning: {selectedImages.size - selectedUnusedCount} selected image(s) are marked as "used".
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDeleteImages}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Sub-component: used image card ────────────────────────────────────────────
function ImageCard({
  image,
  formatFileSize,
  getFolderColor,
  getFolderLabel,
}: {
  image: ImageFile
  formatFileSize: (b: number) => string
  getFolderColor: (f: string) => string
  getFolderLabel: (f: string) => string
}) {
  const normalised = image.folder.replace("cloudinary/", "")
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={image.path}
          alt={image.filename}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg" }}
        />
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge className={getFolderColor(image.folder)}>{getFolderLabel(normalised)}</Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">Used</Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {image.storageType === "cloudinary"
            ? <><Cloud className="w-3 h-3 text-blue-500" /><span>Cloudinary</span></>
            : <><HardDrive className="w-3 h-3" /><span>Local</span></>}
        </div>
        <p className="text-sm font-medium truncate" title={image.filename}>{image.filename}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
        {image.usedBy.length > 0 && (
          <p className="text-xs text-muted-foreground truncate" title={image.usedBy.join(", ")}>
            {image.usedBy[0]}{image.usedBy.length > 1 ? ` +${image.usedBy.length - 1} more` : ""}
          </p>
        )}
      </CardContent>
    </Card>
  )
}