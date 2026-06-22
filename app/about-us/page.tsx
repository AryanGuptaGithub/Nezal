// app/about-us/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Leaf,
  FlaskConical,
  BadgeCheck,
  Shield,
  Heart,
  Clock,
  MessageSquare,
  Hotel,
  Sparkles,
  Quote,
  Star,
} from "lucide-react";
import { BRAND } from "@/lib/config";

// ─── Data ────────────────────────────────────────────────────────────────────

const philosophy = [
  {
    icon: FlaskConical,
    title: "Ingredient Integrity",
    description:
      "Carefully selected ingredients. Thoughtfully formulated. No unnecessary complexity. Every formula is built around active botanicals — Aloe Vera, Shea Butter, Saffron, Himalayan Salt, Seaweed — chosen for the role each plays within the formulation, not just to appear on the label.",
  },
  {
    icon: BadgeCheck,
    title: "Manufactured to Earn Trust",
    description:
      "Every batch is produced to exacting standards in our own facility — so consistency, not chance, is what reaches you.",
  },
  {
    icon: Shield,
    title: "Effective Without Harshness",
    description:
      "We formulate for visible results while respecting the skin's natural balance — no products that work by stripping or overcorrecting.",
  },
  {
    icon: Heart,
    title: "Accessible, Not Exclusive",
    description:
      "Premium quality shouldn't mean a premium price tag few can justify. Elevated self-care, priced for everyday life.",
  },
];

const commitments = [
  {
    icon: Shield,
    title: "Safety You Don't Have to Question",
    description:
      "Dermatologically tested, thoughtfully formulated without unnecessary harsh ingredients, never tested on animals. If we wouldn't use it ourselves, it doesn't ship.",
  },
  {
    icon: CheckCircle,
    title: "Honesty on the Label",
    description:
      "What's written on the pack is what's in the bottle — no vague claims, no hidden substitutions, no fine print designed to mislead.",
  },
  {
    icon: Clock,
    title: "Consistency, Order After Order",
    description:
      "The product that delighted you the first time is exactly what arrives the tenth time. Batch after batch, no surprises — the same body lotion, the same bath salts, every single time.",
  },
  {
    icon: MessageSquare,
    title: "Standing Behind What We Sell",
    description:
      "If something isn't right, we make it right — responsive support and straightforward returns, not an inbox that goes quiet.",
  },
];

const trustReasons = [
  {
    icon: Hotel,
    title: "Hospitality Partners Hold Us to a Higher Standard",
    description:
      "Premium hotels and resorts audit consistency, formulation safety, and supply reliability before a single bar of soap reaches a guest room. Nezal has earned and kept that trust — the same standards behind a five-star amenity are behind every bottle you buy for your own home.",
  },
  {
    icon: FlaskConical,
    title: "Transparency Isn't a Marketing Line — It's a Practice",
    description:
      `We name our actives. Redensyl in our hair serum. Niacinamide in our face serum. Kojic Acid in our brightening soaps. When a formula works, we tell you exactly why — not behind vague terms like "active complex" or "proprietary blend."`,
  },
  {
    icon: BadgeCheck,
    title: "Manufactured, Not Merely Marketed",
    description:
      "Every Nezal product is manufactured under our own technical oversight — the same formulation, quality, and production standards applied without exception to every bar of soap, every serum, every bottle that carries the Nezal name.",
  },
  {
    icon: MessageSquare,
    title: "Real Answers When You Need Them",
    description:
      "Skincare questions don't always fit a FAQ page. Whether it's a query about a specific ingredient, a skin concern, or an order, our support team responds with real answers, not scripted ones.",
  },
];

const stats = [
  { value: "50,000+", label: "Happy Customers" },
  { value: "4.9★", label: "Average Rating" },
  { value: "15+", label: "Years of R&D" },
  { value: "24/7", label: "Expert Support" },
];

const botanicals = ["Aloe Vera", "Shea Butter", "Saffron", "Seaweed", "Himalayan Salt", "Redensyl", "Niacinamide"];

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AboutUs() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#f4f9f4", color: "#1a3a2a" }}>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden pt-28 pb-24 md:pt-36 md:pb-32"
        style={{ backgroundColor: "#1a3a2a" }}
      >
        {/* Subtle organic texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 40%, #4a7c59 0%, transparent 60%),
                              radial-gradient(ellipse 60% 80% at 80% 70%, #8fad6a 0%, transparent 60%)`,
          }}
        />

        <div className="container mx-auto max-w-6xl px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <Leaf className="h-4 w-4" style={{ color: "#7abf6a" }} />
              <span className="text-sm tracking-widest uppercase" style={{ color: "#7abf6a", letterSpacing: "0.15em" }}>
                Crafted by Nature. Refined by Science. Inspired by Ritual.
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
              style={{ color: "#f4f9f4", fontWeight: 700 }}
            >
              About{" "}
              <span style={{ color: "#86d4a0" }}>{BRAND.name}</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl leading-relaxed"
              style={{ color: "#a8c9a0", maxWidth: "560px" }}
            >
              At {BRAND.name}, skincare is more than a daily routine — it is a ritual of care,
              confidence, and well-being. Born from a passion for thoughtfully crafted personal care,
              {BRAND.name} was founded on one simple belief: exceptional skincare begins with exceptional
              ingredients. In a world crowded with harsh formulations and fleeting trends, we chose a
              different path — rooted in botanical wisdom and real formulation expertise.
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{ background: "linear-gradient(to bottom, transparent, #f4f9f4)" }}
        />
      </section>

      {/* ── Botanical ingredient pills ── */}
      <div className="py-10 border-b" style={{ borderColor: "#d4e8d0" }}>
        <div className="container mx-auto max-w-6xl px-6">
          <p className="text-xs tracking-widest uppercase mb-5 text-center" style={{ color: "#4a6e54", letterSpacing: "0.15em" }}>
            Key Botanicals &amp; Actives
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {botanicals.map((b) => (
              <span
                key={b}
                className="px-4 py-1.5 rounded-full text-sm font-medium border"
                style={{ backgroundColor: "#e8f2e4", borderColor: "#b8d4b0", color: "#2a4a35" }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Story ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Text */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs tracking-widest uppercase mb-4" style={{ color: "#4a6e54", letterSpacing: "0.15em" }}>
                Our Story
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-8" style={{ color: "#1a3a2a", lineHeight: 1.15 }}>
                The {BRAND.name} Story
              </motion.h2>
              <motion.div variants={stagger} className="space-y-5 text-base leading-relaxed" style={{ color: "#3d5c45" }}>
                <motion.p variants={fadeUp}>
                  Today, {BRAND.name} is a modern skincare, hair care, bath &amp; body care, and wellness brand
                  inspired by botanical ingredients and formulation science, spanning premium handmade soap, advanced
                  face serums, nourishing herbal shampoo and conditioner, body lotion, Aloe Vera gels, bath salts,
                  and wellness essentials — each one designed to turn an ordinary moment into a considered one.
                </motion.p>
                <motion.p variants={fadeUp}>
                  Every formulation is manufactured in technical collaboration with Highbrow Healthcare at our
                  state-of-the-art facility in Navsari, Gujarat, where stringent quality standards, carefully
                  selected ingredients, and modern formulation science come together. Ingredients such as Aloe Vera,
                  Shea Butter, Saffron, Seaweed, Himalayan Salt, Redensyl, and Niacinamide are chosen for their
                  proven role in supporting healthy-looking skin, stronger hair, and lasting wellness — not for how
                  they trend.
                </motion.p>
                <motion.p variants={fadeUp}>
                  What sets {BRAND.name} apart isn't a single ingredient or claim — it's the refusal to choose
                  between them. Effective skincare that feels luxurious. Natural formulations that still deliver
                  results. Premium quality, crafted for daily rituals.
                </motion.p>
                <motion.p variants={fadeUp}>
                  Our standards extend beyond retail. {BRAND.name} is also trusted by hospitality partners and
                  premium hotels seeking guest amenities that reflect comfort, care, and refinement.
                </motion.p>
                <motion.div variants={fadeUp} className="flex items-start gap-3 pt-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "#5a8a4a" }} />
                  <p className="font-medium" style={{ color: "#1a3a2a" }}>
                    This is {BRAND.name}: thoughtfully crafted skincare inspired by nature, refined by science,
                    and designed for modern living.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div
                className="absolute -top-6 -left-6 w-full h-full rounded-3xl"
                style={{ backgroundColor: "#d4e8d0", zIndex: 0 }}
              />
              <div className="relative z-10 rounded-3xl overflow-hidden aspect-[4/5]">
                <img
                  src="/aboutus.png"
                  alt={`${BRAND.name} facility`}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(20,50,30,0.55) 0%, transparent 50%)" }}
                />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-sm font-medium text-white/90">
                    Developed with precision, delivered with care
                  </p>
                  <p className="text-xs mt-1 text-white/60">Navsari, Gujarat</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="py-16 border-y" style={{ backgroundColor: "#e8f2e4", borderColor: "#d4e8d0" }}>
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-1" style={{ color: "#1a3a2a" }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: "#4a6e54" }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Philosophy ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-16"
          >
            <motion.p variants={fadeUp} className="text-xs tracking-widest uppercase mb-4" style={{ color: "#4a6e54", letterSpacing: "0.15em" }}>
              The Philosophy
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#1a3a2a" }}>
              The {BRAND.name} Philosophy
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg max-w-2xl leading-relaxed" style={{ color: "#3d5c45" }}>
              We believe true beauty begins with care. Inspired by nature, guided by expertise, and crafted
              with attention to detail, {BRAND.name} creates premium skincare and wellness experiences designed
              to nourish the body, uplift the senses, and transform everyday routines into meaningful rituals.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6"
          >
            {philosophy.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="flex gap-5 p-7 rounded-2xl border"
                  style={{ backgroundColor: "#f4f9f4", borderColor: "#d4e8d0" }}
                >
                  <div
                    className="flex-shrink-0 p-2.5 rounded-xl h-fit"
                    style={{ backgroundColor: "#e8f2e4" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#2e6645" }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#1a3a2a" }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#3d5c45" }}>{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-center text-base italic font-medium"
            style={{ color: "#2e6645" }}
          >
            "Luxury-inspired in experience, thoughtfully crafted in substance, and designed for everyday rituals of care and well-being."
          </motion.p>
        </div>
      </section>

      {/* ── Commitments ── */}
      <section className="py-24 md:py-32" style={{ backgroundColor: "#1a3a2a" }}>
        <div className="container mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-16"
          >
            <motion.p variants={fadeUp} className="text-xs tracking-widest uppercase mb-4" style={{ color: "#86d4a0", letterSpacing: "0.15em" }}>
              Our Commitments
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#f4f9f4" }}>
              A promise, every<br />single order.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg max-w-2xl leading-relaxed" style={{ color: "#a8c9a0" }}>
              A philosophy is what we believe. A commitment is what we promise to do about it — whether
              you're buying your first bar of soap or restocking a routine you've trusted for years.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-5"
          >
            {commitments.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="flex gap-5 p-7 rounded-2xl"
                  style={{ backgroundColor: "rgba(240,249,240,0.06)", border: "1px solid rgba(74,124,89,0.25)" }}
                >
                  <div
                    className="flex-shrink-0 p-2.5 rounded-xl h-fit"
                    style={{ backgroundColor: "rgba(74,124,89,0.15)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#4a7c59" }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#f4f9f4" }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#a8c9a0" }}>{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center text-base font-medium"
            style={{ color: "#4a7c59" }}
          >
            Because trust isn't a tagline. It's earned in every box that leaves our facility — and kept by what happens after it arrives.
          </motion.p>
        </div>
      </section>

      {/* ── Why Customers Trust Nezal ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-16"
          >
            <motion.p variants={fadeUp} className="text-xs tracking-widest uppercase mb-4" style={{ color: "#4a6e54", letterSpacing: "0.15em" }}>
              Why Customers Trust {BRAND.name}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#1a3a2a" }}>
              Trust is built,<br />not claimed.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg max-w-2xl leading-relaxed" style={{ color: "#3d5c45" }}>
              Transaction by transaction, ingredient by ingredient.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6"
          >
            {trustReasons.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="p-7 rounded-2xl border"
                  style={{ backgroundColor: "#f4f9f4", borderColor: "#d4e8d0" }}
                >
                  <div
                    className="inline-flex p-2.5 rounded-xl mb-4"
                    style={{ backgroundColor: "#e8f2e4" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#2e6645" }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#1a3a2a" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#3d5c45" }}>{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 md:py-28" style={{ backgroundColor: "#e8f2e4" }}>
        <div className="container mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mx-auto text-center">
            <Leaf className="mx-auto h-8 w-8 mb-6" style={{ color: "#5a8a4a" }} />
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#1a3a2a" }}>
              Ready to begin<br />your ritual?
            </h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: "#3d5c45" }}>
              Experience thoughtfully crafted skincare inspired by nature, refined by science,
              and designed for modern living.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/shop"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#1a3a2a", color: "#f4f9f4" }}
              >
                Shop Now
              </a>
              <a
                href="/contact-us"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-sm border transition-all hover:opacity-80"
                style={{ backgroundColor: "transparent", borderColor: "#1a3a2a", color: "#1a3a2a" }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}