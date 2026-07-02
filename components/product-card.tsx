// components/product-card.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCartStore } from "@/lib/store/cart-store";
import { useToast } from "@/hooks/use-toast";
import { WishlistButton } from "@/components/wishlist-button";

import { Phone, Zap } from "lucide-react";

/* ───────────────────────────────────── */

interface Size {
  size: string;
  unit: "ml" | "l" | "g" | "kg";
  quantity: number;
  price: number;
  discountPrice?: number;
  stock: number;
}

interface FlashSaleInfo {
  saleId: string;
  saleName: string;
  discountPercent: number;
  endsAt: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image?: string;
  company: {
    name: string;
    slug: string;
  };
  size?: "sm" | "md";
  hasMultipleSizes?: boolean;
  sizes?: Size[];
  stock?: number;
  // Present whenever the product is currently part of an active flash sale.
  // Comes straight through from the product API responses — see lib/flashSale.ts
  flashSale?: FlashSaleInfo | null;
}

/* ───────────────────────────────────── */

export default function ProductCard({
  id,
  name,
  price,
  discountPrice,
  image,
  company,
  hasMultipleSizes = false,
  sizes = [],
  stock = 999,
  flashSale = null,
}: ProductCardProps) {
  const router = useRouter();

  const { toast } = useToast();

  const addItem = useCartStore((state) => state.addItem);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const displayPrice =
    hasMultipleSizes && sizes.length > 0
      ? Math.min(...sizes.map((s) => s.discountPrice || s.price))
      : discountPrice || price;

  const isOutOfStock = hasMultipleSizes
    ? sizes.every((s) => s.stock < 1)
    : stock < 1;

  function handleShopNow(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/shop/${company.slug}/product/${id}`);
  }

  function handleAddToCart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const totalItems = getTotalItems();

    if (totalItems >= 5) {
      setShowBulkOrderModal(true);
      return;
    }

    if (hasMultipleSizes && sizes.length > 0) {
      if (!selectedSize) {
        toast({
          title: "Size required",
          description: "Please select a size.",
          variant: "destructive",
        });
        return;
      }

   addItem({
  productId: id,
  name,
  price: selectedSize.price,
  discountPrice: selectedSize.discountPrice,
  image,
  quantity: 1,
  company,
  selectedSize,
  flashSale,
});

      toast({ title: "Added to cart", description: `${name} added.` });
      return;
    }

    addItem({
  productId: id,
  name,
  price,
  discountPrice,
  image,
  quantity: 1,
  company,
  flashSale,
});

    toast({ title: "Added to cart", description: `${name} added.` });
  }

  return (
    <>
      <div
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ borderColor: "var(--color-border)" }}
        onClick={() => router.push(`/shop/${company.slug}/product/${id}`)}
      >

      {/* IMAGE */}
<div className="group relative overflow-hidden rounded-2xl bg-[var(--color-bg-cream)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ aspectRatio: "4/3" }}>

  {/* subtle gradient overlay for depth */}
  <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-black/5" />

  {/* FLASH SALE RIBBON — only appears when the product is in an active sale.
      Diagonal corner ribbon so it reads as "time-limited event", distinct
      from the plain "% OFF" badge, which just states a price fact. */}
  {flashSale && (
    <div className="absolute -left-10 top-4 z-20 w-36 -rotate-45 overflow-hidden">
      <div
        className="flex items-center justify-center gap-1 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
        style={{ backgroundColor: "#E4432B" }}
      >
        <Zap className="h-3 w-3 fill-current" />
        Flash Sale
      </div>
    </div>
  )}

  {/* DISCOUNT BADGE */}
  {discount > 0 && (
    <div className="absolute right-3 top-3 z-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
      {discount}% OFF
    </div>
  )}

  {/* ❤️ WISHLIST BUTTON — bottom-right so it never collides with the
      ribbon (top-left) or the discount badge (top-right) */}
  <div
    className="absolute bottom-3 right-3 z-20 rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-md transition hover:bg-white"
    onClick={(e) => e.stopPropagation()}
  >
    <WishlistButton productId={id} />
  </div>

  {/* IMAGE */}
  {image && !imgError ? (
    <Image
      src={image}
      alt={name}
      fill
    className="object-cover"
  sizes="(max-width:768px) 50vw, 25vw"
      onLoad={() => setImgLoaded(true)}
      onError={() => {
        setImgError(true);
        setImgLoaded(true);
      }}
    />
  ) : (
    <div className="flex h-full items-center justify-center">
      <div className="relative h-20 w-20 opacity-70">
        <Image
          src="/nezallogo.jpg"
          alt="Logo"
          fill
          className="object-contain"
        />
      </div>
    </div>
  )}

  {/* LOADING SKELETON */}
  {!imgLoaded && image && !imgError && (
    <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200" />
  )}
</div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-[36px] sm:min-h-[48px] text-xs sm:text-sm font-medium text-[var(--color-text-heading)] transition-colors group-hover:text-[var(--color-brand-primary)]">
            {name}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--color-text-heading)]">
              ₹{Math.round(displayPrice).toLocaleString()}
            </span>

            {(discountPrice || hasMultipleSizes) && (
              <span className="text-sm text-neutral-400 line-through">
                ₹{price.toLocaleString()}
              </span>
            )}
          </div>

          {/* SIZE SELECT */}
          {hasMultipleSizes && sizes.length > 0 && (
            <select
              value={
                selectedSize
                  ? `${selectedSize.size}-${selectedSize.quantity}`
                  : ""
              }
              onChange={(e) => {
                const found =
                  sizes.find(
                    (s) => `${s.size}-${s.quantity}` === e.target.value
                  ) || null;
                setSelectedSize(found);
              }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl border px-3 py-2 text-sm outline-none"
            >
              <option value="">Select size</option>
              {sizes.map((s, index) => (
                <option key={index} value={`${s.size}-${s.quantity}`}>
                  {s.size} ({s.quantity}
                  {s.unit}) — ₹{s.discountPrice ?? s.price}
                </option>
              ))}
            </select>
          )}

          {/* BUTTONS */}
          <div
            className="mt-auto flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleShopNow}
              className="h-8 sm:h-10 rounded-xl bg-[var(--color-brand-primary)] text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Shop Now
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                isOutOfStock ||
                (hasMultipleSizes && sizes.length > 0 && !selectedSize)
              }
              className="h-8 sm:h-10 rounded-xl bg-black text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      {/* BULK ORDER MODAL */}
      <Dialog open={showBulkOrderModal} onOpenChange={setShowBulkOrderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Order Enquiry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              You've reached the cart limit. Please contact us for bulk orders.
            </p>

            <div className="space-y-2">
              {["+91 7710076400"].map((num) => (
                <a
                  key={num}
                  href={`tel:${num.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <Phone className="h-4 w-4" />
                  <span>{num}</span>
                </a>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}