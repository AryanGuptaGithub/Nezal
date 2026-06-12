"use client"

/**
 * ProductDescription
 * Parses flat product description text and renders it with proper structure:
 * - Section headings  → green bold heading
 * - ✓ / √ bullet lines → checkmark list
 * - Dot-separated tag lines (e.g. "Exotic • Floral • Radiant") → pill tags
 * - Everything else  → paragraph
 */

import React from "react"

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "tags"; items: string[] }

const KNOWN_HEADINGS = [
  /^why you'?ll love it$/i,
  /^fragrance experience$/i,
  /^key benefits?$/i,
  /^how to use$/i,
  /^ingredients?$/i,
  /^about this product$/i,
  /^product highlights?$/i,
  /^features?$/i,
  /^directions?$/i,
  /^results?$/i,
]

function isHeading(line: string): boolean {
  const t = line.trim()
  if (KNOWN_HEADINGS.some((p) => p.test(t))) return true
  if (t.length < 60 && t === t.toUpperCase() && /[A-Z]/.test(t)) return true
  return false
}

function isBulletLine(line: string): boolean {
  return /^[✓√•\-–—]\s/.test(line.trim())
}

function isTagLine(line: string): boolean {
  const parts = line.trim().split(/\s[•·]\s/)
  return parts.length >= 2 && parts.every((p) => p.length < 30)
}

function stripBullet(line: string): string {
  return line.replace(/^[✓√•\-–—]\s+/, "").trim()
}

const SPLIT_HEADINGS = [
  "Why You'll Love It",
  "Fragrance Experience",
  "Key Benefits",
  "How to Use",
  "Ingredients",
  "About this product",
  "Features",
  "Directions",
  "Results",
]

function parseDescription(raw: string): Block[] {
  if (!raw?.trim()) return []

  let text = raw

  if (!text.includes("\n")) {
    for (const h of SPLIT_HEADINGS) {
      text = text.replace(new RegExp(`([\\.!?]\\s+)(${h})`, "gi"), `$1\n$2\n`)
      text = text.replace(new RegExp(`(\\s)(${h})(\\s)`, "gi"), `\n$2\n`)
    }
    text = text.replace(/([^\n])\s*(✓|√)/g, "$1\n$2")
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (isHeading(line)) {
      blocks.push({ type: "heading", text: line })
      i++
      continue
    }

    if (isTagLine(line)) {
      blocks.push({ type: "tags", items: line.split(/\s[•·]\s/).map((s) => s.trim()) })
      i++
      continue
    }

    if (isBulletLine(line)) {
      const items: string[] = []
      while (i < lines.length && isBulletLine(lines[i])) {
        items.push(stripBullet(lines[i]))
        i++
      }
      blocks.push({ type: "bullets", items })
      continue
    }

    blocks.push({ type: "paragraph", text: line })
    i++
  }

  return blocks
}

interface Props {
  description: string
  className?: string
}

export default function ProductDescription({ description, className = "" }: Props) {
  const blocks = parseDescription(description)
  if (!blocks.length) return null

  return (
    <div className={`space-y-3 text-sm ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading":
            return (
              <h3
                key={idx}
                className="font-semibold text-[15px] mt-4 first:mt-0"
                style={{ color: "#1e3a28" }}
              >
                {block.text}
              </h3>
            )
          case "paragraph":
            return (
              <p key={idx} className="leading-relaxed" style={{ color: "#4a5e50" }}>
                {block.text}
              </p>
            )
          case "bullets":
            return (
              <ul key={idx} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2" style={{ color: "#4a5e50" }}>
                    <span className="font-bold mt-0.5 shrink-0" style={{ color: "#2a5c3a" }}>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          case "tags":
            return (
              <div key={idx} className="flex flex-wrap gap-2 pt-1">
                {block.items.map((tag, j) => (
                  <span
                    key={j}
                    className="px-3 py-1 rounded-full text-xs font-medium border"
                    style={{ borderColor: "#2a5c3a", color: "#2a5c3a", backgroundColor: "#f0f7f0" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}