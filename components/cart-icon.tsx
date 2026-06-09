// /components/cart-icon.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react"

export function CartIcon() {


  const router = useRouter();

    const { data: session } = useSession()

  // mounted prevents server/client mismatch for UI that depends on client-only storage
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // read total items from your client store (may read localStorage/persisted data on client)
  const totalItems = useCartStore((state) => state.getTotalItems());

  // If you want to still avoid rendering the number until mounted:
  const showBadge = mounted && !!session?.user && totalItems > 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative cursor-pointer"
      onClick={() => router.push("/cart")}
      aria-label="Open cart"
    >
      <ShoppingCart className="w-5 h-5" />
      {showBadge && (
        <span
          className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold hover:scale-150 rounded-full bg-[#ee1313] w-5 h-5 flex items-center justify-center"
          aria-live="polite"
        >
          {totalItems}
        </span>
      )}
    </Button>
  );
}
