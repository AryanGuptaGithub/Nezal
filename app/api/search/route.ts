// app/api/search/route.ts
//
// Unified search endpoint powering the header SearchBar dropdown.
// Returns up to N matches across three categories in one response:
//   - products:   name match (existing product search behavior)
//   - concerns:   matched against the known concern list (mirrors
//                 the mega menu's CONCERNS array)
//   - ingredients: distinct ingredient names matched from `ingredients`
//                 and `keyIngredients.name` across all active products
//
// GET /api/search?q=tea+tree

import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Product } from "@/lib/models/product"
import { getActiveFlashSaleMap, applyFlashSaleToList } from "@/lib/flashSale"

const MAX_PER_GROUP = 5

// Keep this in sync with the CONCERNS list used in the header mega menu.
const CONCERNS = [
  { label: "Acne", slug: "acne" },
  { label: "Pigmentation", slug: "pigmentation" },
  { label: "Open Pores", slug: "open-pores" },
  { label: "Hydration", slug: "hydration" },
  { label: "Hair Fall", slug: "hairfall" },
  { label: "Dryness", slug: "dryness" },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || ""

    if (q.length < 2) {
      return NextResponse.json({ products: [], concerns: [], ingredients: [] })
    }

    await connectDB()
    const regex = new RegExp(q, "i")

    // ── Products ──
    const products = await Product.find(
      {
        isActive: true,
        $or: [{ name: { $regex: regex } }, { description: { $regex: regex } }],
      },
      { _id: 1, name: 1, price: 1, discountPrice: 1, image: 1, company: 1 }
    )
      .populate("company", "slug name")
      .limit(MAX_PER_GROUP)
      .lean()

    // Merge in flash-sale pricing so a searched product shows the same
    // sale price / ribbon data as the shop grid and product page.
    const flashSaleMap = await getActiveFlashSaleMap()
    const productsWithSales = applyFlashSaleToList(products, flashSaleMap)

    // ── Concerns (static list — no DB query needed) ──
    const concerns = CONCERNS.filter((c) => regex.test(c.label)).slice(0, MAX_PER_GROUP)

    // ── Ingredients (distinct names matched from product data) ──
    const ingredientDocs = await Product.find(
      {
        isActive: true,
        $or: [
          { ingredients: { $elemMatch: { $regex: regex } } },
          { "keyIngredients.name": { $regex: regex } },
        ],
      },
      { ingredients: 1, "keyIngredients.name": 1 }
    ).lean()

    const seen = new Set<string>()
    const ingredients: { name: string; slug: string }[] = []

    for (const doc of ingredientDocs) {
      const names = [
        ...(doc.ingredients || []),
        ...((doc.keyIngredients || []).map((k: any) => k.name)),
      ]
      for (const name of names) {
        if (!name || !regex.test(name)) continue
        const key = name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        ingredients.push({ name, slug: slugify(name) })
        if (ingredients.length >= MAX_PER_GROUP) break
      }
      if (ingredients.length >= MAX_PER_GROUP) break
    }

    return NextResponse.json({ products: productsWithSales, concerns, ingredients })
  } catch (error) {
    console.error("[search] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}