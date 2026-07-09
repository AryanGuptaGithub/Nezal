// app/api/products/route.ts
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/product";
import { Company } from "@/lib/models/company";
import { Category } from "@/lib/models/category";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveFlashSaleMap, applyFlashSaleToList } from "@/lib/flashSale";
import Fuse from "fuse.js";

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = process.env.NODE_ENV === "development" ? 0 : 1000 * 60 * 2; // 2 minutes

function getCacheKey(params: Record<string, string>) {
  return JSON.stringify(params);
}

function getCachedResponse(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedResponse(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// ── FIX: normalize any value (string with commas/newlines, or array) → string[] ──
function normalizeStringArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .flatMap((v) =>
        typeof v === "string"
          ? v.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
          : []
      );
  }
  if (typeof val === "string") {
    return val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // ── WISHLIST BATCH FETCH ──────────────────────────────
    const ids = searchParams.get("ids");
    if (ids) {
      const idList = ids
        .split(",")
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (!idList.length) {
        return NextResponse.json({ products: [] });
      }

      const products = await Product.find({ _id: { $in: idList } })
        .populate("company", "name slug")
        .populate("category", "name slug")
        .select("name slug image images sizes company category stock price discountPrice")
        .lean();

      // Flash-sale pricing shows up in the wishlist too, not just the shop grid
      const flashSaleMap = await getActiveFlashSaleMap();
      const productsWithSales = applyFlashSaleToList(products, flashSaleMap);

      return NextResponse.json({ products: productsWithSales });
    }
    // ─────────────────────────────────────────────────────

    const company = searchParams.get("company");
    const category = searchParams.get("category");
    const search = searchParams.get("search") || "";
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "12");
    const exclude = searchParams.get("exclude");
    const includeInactiveParam = searchParams.get("includeInactive") === "true";

    // Only an authenticated admin can actually see inactive products
    let includeInactive = false;
    if (includeInactiveParam) {
      const session = await getServerSession(authOptions);
      includeInactive = !!session?.user && session.user.role === "admin";
    }

    const cacheKey = getCacheKey({ company, category, search, page, limit, exclude, includeInactive: String(includeInactive) });
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const query: any = includeInactive ? {} : { isActive: true };

    const [companyDoc, categoryDoc] = await Promise.all([
      company ? Company.findOne({ slug: company, isActive: true }).select("_id") : null,
      category ? Category.findOne({ slug: category, isActive: true }).select("_id parent") : null,
    ]);

    if (companyDoc) {
      query.company = companyDoc._id;
    }

    if (categoryDoc) {
      if (!categoryDoc.parent) {
        const subCategories = await Category.find({
          parent: categoryDoc._id,
          isActive: true,
        }).select("_id");
        const categoryIds = [
          categoryDoc._id,
          ...subCategories.map((sub) => sub._id),
        ];
        query.category = { $in: categoryIds };
      } else {
        query.category = categoryDoc._id;
      }
    }

    if (exclude) {
      query._id = { $ne: exclude };
    }

    

    const skip = (page - 1) * limit;


      let products: any[];
      let total: number;

    if (search) {
  // Typo-tolerant search: pull everything matching the other filters,
  // then let Fuse.js rank by closeness so "sleo vera" still finds "Aloe Vera".
  const candidates = await Product.find(query)
    .populate("company", "name slug")
    .populate("category", "name slug")
    .select("name slug price discountPrice image images stock company category isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const fuse = new Fuse(candidates, {
    keys: [
      { name: "name", weight: 0.7 },
      { name: "company.name", weight: 0.3 },
    ],
    threshold: 0.4,        // 0 = exact only, 1 = match almost anything
    ignoreLocation: true,  // typo can be anywhere in the word, not just start
    minMatchCharLength: 2,
  });

  const fuzzyResults = fuse.search(search).map((r) => r.item);
  total = fuzzyResults.length;
  products = fuzzyResults.slice(skip, skip + limit);
} else {
  [products, total] = await Promise.all([
    Product.find(query)
      .populate("company", "name slug")
      .populate("category", "name slug")
      .select("name slug price discountPrice image images stock company category isActive createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Product.countDocuments(query),
  ]);
}

    // ── Merge in flash-sale pricing so every listing (shop, search, home, etc.)
    //    reflects an active sale automatically ──────────────────────────────
    const flashSaleMap = await getActiveFlashSaleMap();
    const productsWithSales = applyFlashSaleToList(products, flashSaleMap);

    const responseData = {
      products: productsWithSales,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    // Note: flash sales are time-boxed to the minute, so caching this for
    // the full 2-minute TTL is fine — worst case a sale's start/end is off
    // by up to CACHE_TTL. If that's too loose, drop the cache write when
    // flashSaleMap.size > 0, or shorten CACHE_TTL.
    setCachedResponse(cacheKey, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      discountPrice,
      image,
      images,
      category,      // subcategory ID (set when a subcategory is selected)
      mainCategory,  // fallback when the main category has no subcategories
      company,
      stock,
      sku,
      weight,
      amazonUrl,
      ingredients,
      benefits,
      usage,
      suitableFor,
      results,
      sizes,
      isActive,
    } = body;

    // ── FIX: resolve category — prefer subcategory, fall back to mainCategory ──
    const resolvedCategory =
      category && category !== ""
        ? category
        : mainCategory && mainCategory !== ""
        ? mainCategory
        : undefined;

    const product = new Product({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description,
      price,
      discountPrice,
      image: image || (images && images.length > 0 ? images[0] : undefined),
      images: images || (image ? [image] : []),
      category: resolvedCategory,               // ← fixed: never empty when mainCategory is set
      company,
      stock,
      sku,
      weight: weight ? Number(weight) : 0.3,
      amazonUrl: amazonUrl?.trim() || "",
      ingredients: normalizeStringArray(ingredients),  // ← fixed: handles \n and ,
      benefits:    normalizeStringArray(benefits),
      suitableFor: normalizeStringArray(suitableFor),
      usage,
      results,
      sizes,
      isActive: isActive ?? true,
    });

    await product.save();

    const productObject = product.toObject ? product.toObject() : product;

    return NextResponse.json(productObject, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}