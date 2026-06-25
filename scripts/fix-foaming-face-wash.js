/**
 * ============================================================
 *  FIX: Foaming Face Wash products not showing on collection page
 * ------------------------------------------------------------
 *  Root cause: the "Foaming Face Wash" Collection document has
 *  a slug (e.g. "foaming-face-wash") that the mega menu links
 *  to, but the actual Product documents for that line were
 *  seeded with a DIFFERENT collectionSlug (e.g. "face-wash").
 *  Since /collections/[slug] matches products strictly by
 *  `Product.collectionSlug === slug`, the page renders zero
 *  products even though everything looks fine in the admin
 *  grid (which only shows the high-level `category`, not the
 *  collection slug).
 *
 *  This script:
 *    1. Looks up the real Collection slug.
 *    2. Finds products whose name matches "foaming face wash"
 *       (case-insensitive, word-order agnostic).
 *    3. Shows you their CURRENT collectionSlug vs what it
 *       should be.
 *    4. Only writes changes if you pass --apply.
 *
 *  Usage:
 *    node scripts/fix-foaming-face-wash.js                # dry run (safe, default)
 *    node scripts/fix-foaming-face-wash.js --apply         # actually writes the fix
 *
 *  Requires MONGODB_URI to be set in your environment, e.g.:
 *    MONGODB_URI="mongodb+srv://..." node scripts/fix-foaming-face-wash.js
 *  or put it in a .env.local / .env file in the project root —
 *  this script will auto-load that if present.
 * ============================================================
 */

import path from "path";

// Best-effort load of .env.local / .env if dotenv is available — harmless if not.
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") })
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") })
} catch {
  /* dotenv not installed — that's fine, env vars may already be set */
}

const mongoose = require("mongoose")

const MONGODB_URI = process.env.MONGODB_URI
const APPLY = process.argv.includes("--apply")

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Set it in your env or .env.local, then re-run.")
  process.exit(1)
}

// Minimal schemas — only the fields we need to read/write.
const Collection = mongoose.models.Collection || mongoose.model(
  "Collection",
  new mongoose.Schema({ name: String, slug: String }, { strict: false })
)
const Product = mongoose.models.Product || mongoose.model(
  "Product",
  new mongoose.Schema({ name: String, collectionSlug: String, isActive: Boolean }, { strict: false })
)

// Candidate slugs this collection has been seeded under across your various seed scripts.
const CANDIDATE_SLUGS = ["foaming-face-wash", "face-wash"]

async function main() {
  console.log(`\n🔌  Connecting to MongoDB...`)
  await mongoose.connect(MONGODB_URI)
  console.log(`✅  Connected.\n`)

  // 1. Find which of the candidate Collection documents actually exists.
  const collections = await Collection.find({ slug: { $in: CANDIDATE_SLUGS } }, { name: 1, slug: 1 }).lean()

  if (collections.length === 0) {
    console.error("❌  No Collection document found with slug 'foaming-face-wash' or 'face-wash'.")
    console.error("    This product line may not have a Collection document at all — check the admin panel.")
    await mongoose.disconnect()
    process.exit(1)
  }

  if (collections.length > 1) {
    console.warn("⚠️   Found MORE THAN ONE matching collection — this itself may be a duplicate-data bug:")
    collections.forEach((c) => console.warn(`     - "${c.name}" (slug: ${c.slug})`))
  }

  // Prefer "foaming-face-wash" if it exists (matches the mega menu link), otherwise fall back.
  const target = collections.find((c) => c.slug === "foaming-face-wash") ?? collections[0]
  console.log(`🎯  Treating "${target.slug}" as the canonical collection slug (the one the site links to).\n`)

  // 2. Find products belonging to this product line, regardless of word order in the name.
  const products = await Product.find({
    name: { $regex: /foaming.*face.*wash|face.*wash.*foaming/i },
  }).lean()

  if (products.length === 0) {
    console.error("❌  No products found matching 'Foaming Face Wash' by name. Double-check the product names in the admin panel.")
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`📦  Found ${products.length} matching product(s):\n`)

  const toFix = []
  for (const p of products) {
    const current = p.collectionSlug || "(empty)"
    const needsFix = p.collectionSlug !== target.slug
    console.log(
      `   - "${p.name}"  [${p._id}]\n` +
      `     current collectionSlug: ${current}\n` +
      `     ${needsFix ? `➡️  will be updated to: ${target.slug}` : "✅  already correct"}\n`
    )
    if (needsFix) toFix.push(p)
  }

  if (toFix.length === 0) {
    console.log("✅  Nothing to fix — all matching products already have the correct collectionSlug.")
    console.log("    If they're still not showing, double check each product's isActive flag and stock.")
    await mongoose.disconnect()
    return
  }

  if (!APPLY) {
    console.log(`\n👀  Dry run only — no changes written. Re-run with --apply to fix the ${toFix.length} product(s) above.`)
    await mongoose.disconnect()
    return
  }

  console.log(`\n✍️   Applying fix to ${toFix.length} product(s)...`)
  for (const p of toFix) {
    await Product.updateOne({ _id: p._id }, { $set: { collectionSlug: target.slug } })
    console.log(`   ✅  Updated "${p.name}"`)
  }

  console.log(`\n🎉  Done. Refresh /collections/${target.slug} on the live site to confirm.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error("❌  Script failed:", err)
  process.exit(1)
})