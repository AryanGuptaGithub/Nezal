"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart-store";
import { useToast } from "@/hooks/use-toast";
import { Leaf, ShieldCheck, FlaskConical, Rabbit, CalendarCheck, Lock, Flower2 } from "lucide-react"

// ── Types ─────────────────────────────────────────────
interface CategoryProduct {
  _id: string;
  name: string;
  slug: string;
  price?: number;
  discountPrice?: number;
  image?: string;
  company: {
    _id: string;
    slug: string;
    name: string;
  };
}

interface ShopByCategoryItem {
  _id: string;
  title: string;
  image: string;
  description?: string;
  isActive: boolean;
  priority: number;
  product?: CategoryProduct | string;
}

interface ShopByCategorySettings {
  isVisible: boolean;
  limit: number;
}

interface ShopByCategoryProps {
  companyId: string;
  companySlug: string;
}

// ── Map title → /collections?category= slug ───────────
const TITLE_TO_CATEGORY: Record<string, string> = {
  "face care":  "face-care",
  "body care":  "body-care",
  "hair care":  "hair-care",
  "gift kits":  "gift-kits",
  "gift kit":   "gift-kits",
  // add more mappings here if your admin uses different titles
};

function getCategoryHref(title: string): string {
  const key = title.toLowerCase().trim();
  const category = TITLE_TO_CATEGORY[key];
  if (category) return `/collections?category=${category}`;
  // fallback — show all collections
  return `/collections`;
}

// ── Category SVG Icons ────────────────────────────────
const CategoryIcon = ({ title }: { title: string }) => {
  const t = title.toLowerCase();
  if (t.includes("face"))
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M9 11c0 1.657 1.343 3 3 3s3-1.343 3-3" />
        <path d="M3 20c0-4 4-7 9-7s9 3 9 7" />
      </svg>
    );
  if (t.includes("body"))
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        <path d="M6.5 8h11l1.5 5-3 1v6h-8v-6L5 13z" />
      </svg>
    );
  if (t.includes("bath") || t.includes("shower"))
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z" />
        <path d="M6 12V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1" />
        <path d="M8 21v1M16 21v1" />
      </svg>
    );
  if (t.includes("massage") || t.includes("oil"))
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  if (t.includes("hair"))
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 5 5 5 9c0 2.5 1 4.5 3 6l1 7h6l1-7c2-1.5 3-3.5 3-6 0-4-3-7-7-7z" />
      </svg>
    );
  if (t.includes("gift"))
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12" />
        <path d="M22 7H2v5h20V7z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    );
  return <Leaf className="h-5 w-5" />;
};

// ── Get category image based on title ─────────────────
const getCategoryImage = (title: string): string => {
  const t = title.toLowerCase();

  if (t.includes("face"))
    return "https://img.magnific.com/free-photo/woman-using-face-roller-skincare_23-2151983502.jpg?semt=ais_hybrid&w=740&q=80";

  if (t.includes("body"))
    return "https://img.magnific.com/free-photo/close-beauty-portrait-topless-woman-with-perfect-skin-holding-bottle-shampoo-lotion-apply-shoulders-body-white-background_343596-8008.jpg?semt=ais_hybrid&w=740&q=80";

  if (t.includes("bath") || t.includes("shower"))
    return "https://media.istockphoto.com/id/1141213118/photo/smiling-female-rubbing-body-with-foam.jpg?s=612x612&w=0&k=20&c=XtCgHPKv78vuDvrpad11ifsbRHT-4_XMq6qhdbeChJk=";

  if (t.includes("massage") || t.includes("oil"))
    return "https://media.istockphoto.com/id/994810170/photo/therapist-pouring-massage-oil-at-spa.jpg?s=612x612&w=0&k=20&c=T2QnfdS3LEVqUV4mOjSRFxxrvHgkHaMjHcfshDIyNL8=";

  if (t.includes("hair"))
    return "https://cdn.prod.website-files.com/667a8e3de4fbbd05a23d72ec/6914604de6ce2410681c4ec6_Natural%20Hair%20Mask%20Formulations%20for%20Restoring%20Damaged%20Hair.webp";

  if (t.includes("gift"))
    return "https://png.pngtree.com/png-vector/20241224/ourmid/pngtree-pink-cosmetic-products-arranged-neatly-symbolizing-beauty-and-self-care-png-image_14846374.png";

  // fallback
  return "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=400&fit=crop";
};

// ── Trust bar ──────────────────────────────────────────
const trustFeatures = [
  { icon: Leaf,          label: "Made In India",            sub: "Proudly crafted in India with love and care" },
  { icon: ShieldCheck,   label: "Dermatologically Tested",  sub: "Safe & effective for all skin types" },
  { icon: FlaskConical,  label: "Premium Ingredients",      sub: "Carefully selected natural & active ingredients" },
  { icon: Rabbit,        label: "Cruelty-Free",              sub: "We do not test on animals" },
  { icon: CalendarCheck, label: "Suitable For Daily Use",   sub: "Gentle care for everyday beautiful you" },
  { icon: Lock,          label: "Secure Payment",            sub: "100% safe & secure checkout" },
]
// ── Main Component ─────────────────────────────────────
export function ShopByCategory({ companyId, companySlug }: ShopByCategoryProps) {
  const [items, setItems] = useState<ShopByCategoryItem[]>([]);
  const [settings, setSettings] = useState<ShopByCategorySettings>({ isVisible: true, limit: 6 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/companies/${companyId}/shop-by-concern`);
        if (!response.ok) throw new Error("Failed to fetch category data");
        const data = await response.json();
        setSettings(data.settings || { isVisible: true, limit: 6 });
        if (Array.isArray(data.items)) {
          const transformed = data.items
            .map((item: any) => {
              if (!item) return null;
              const product = item.product || item.productId;
              return {
                _id: item._id,
                title: item.title,
                image: item.image,
                description: item.description,
                isActive: item.isActive ?? true,
                priority: item.priority ?? 0,
                product:
                  product && typeof product === "object"
                    ? {
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        discountPrice: product.discountPrice,
                        image: product.image,
                        company: product.company || { _id: companyId, slug: companySlug, name: "" },
                      }
                    : undefined,
              };
            })
            .filter((item: ShopByCategoryItem | null): item is ShopByCategoryItem => item !== null);
          setItems(transformed);
        }
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchCategories();
  }, [companyId, companySlug]);

  const activeItems = useMemo(
    () =>
      items
        .filter((i) => i.isActive)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, settings.limit),
    [items, settings.limit]
  );

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-nezal">
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto h-8 w-56" />
            <Skeleton className="mx-auto mt-2 h-1 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-20 w-20 rounded-xl" />
                </div>
                <Skeleton className="mt-4 h-5 w-3/4" />
                <Skeleton className="mt-2 h-10 w-full" />
                <Skeleton className="mt-3 h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !settings.isVisible || activeItems.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      {/* Trust bar */}
      <div className="border-b border-border bg-muted/30 py-5">
        <div className="container-nezal">
         <section className="px-4 py-8" style={{ backgroundColor: "#fdfaf5" }}>
  <div className="mx-auto max-w-6xl rounded-2xl border px-6 py-7" style={{ borderColor: "#e2d9c5", backgroundColor: "#fdfaf5" }}>
 
    {/* Heading with decorative line flourishes */}
    <div className="mb-7 flex items-center justify-center gap-4">
      <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: "#c8b896" }} />
      <h2 className="whitespace-nowrap text-sm font-bold uppercase tracking-widest" style={{ color: "#1e3a28" }}>
        Our Trust, Your Confidence
      </h2>
      <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: "#c8b896" }} />
    </div>
 
    {/* Feature grid */}
    <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2">
      {trustFeatures.map((feat) => (
        <div key={feat.label} className="flex flex-col items-center gap-2 px-2 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2"
            style={{ borderColor: "#1e3a28" }}
          >
            <feat.icon className="h-6 w-6" style={{ color: "#1e3a28" }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide leading-tight" style={{ color: "#1e3a28" }}>
            {feat.label}
          </p>
          <p className="text-xs leading-snug" style={{ color: "#8a8378" }}>
            {feat.sub}
          </p>
        </div>
      ))}
    </div>
 
  </div>
</section>
        </div>
      </div>

      {/* Shop by Category section */}
      <section className="py-16 md:py-20">
        <div className="container-nezal">
          <div className="mb-12 text-center">
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Flower2 className="h-4 w-4" />
              Explore by Category
            </div> */}
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Shop by <span className="text-primary">Category</span>
            </h2>
            <div className="mt-2 flex justify-center">
              <div className="h-0.5 w-24 rounded-full bg-primary" />
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Browse our curated collections and find exactly what you're looking for.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            {activeItems.map((item) => {
              // ✅ THE FIX — links to /collections?category=face-care etc.
              const href = getCategoryHref(item.title);

              const imageUrl = getCategoryImage(item.title);

              return (
                <motion.div
                  key={item._id}
                  variants={cardVariants}
                  whileHover={{ y: -6 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                          <CategoryIcon title={item.title} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
                        <img
                          src={imageUrl}
                          alt={`${item.title} category`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=400&fit=crop";
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link
                        href={href}
                        className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>

                  {/* Bottom hover bar */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </>
  );
}