// app/orders-returns/page.tsx
import Link from "next/link"

export const metadata = {
  title: "Orders & Returns | Nezal Herbocare",
  description: "Orders and Returns policy for Nezal Herbocare",
}

export default function OrdersReturnsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-[#f9f6f1] border-b border-border py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span>Orders & Returns</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Orders & Returns</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-10">

          <div>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              We have a <strong className="text-foreground">3-day return policy</strong>, which means you have 3 days after receiving your item to request a return.
            </p>
            <p className="text-muted-foreground leading-relaxed text-[15px] mt-3">
              To be eligible for a return, your item must be in the same condition that you received it — unworn or unused, with tags, and in its original packaging. You'll also need the receipt or proof of purchase.
            </p>
            <p className="text-muted-foreground leading-relaxed text-[15px] mt-3">
              To start a return, contact us at{" "}
              <a href="mailto:info@nezalherbocare.com" className="underline hover:text-foreground transition-colors">
                info@nezalherbocare.com
              </a>. If your return is accepted, we'll send you a return shipping label and instructions. Items sent back without first requesting a return will not be accepted.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">Damages and Issues</h2>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you received the wrong item — so that we can evaluate the issue and make it right.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">Exceptions / Non-Returnable Items</h2>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Please mail us regarding return of products at{" "}
              <a href="mailto:info@nezalherbocare.com" className="underline hover:text-foreground transition-colors">
                info@nezalherbocare.com
              </a>.
            </p>
            <p className="text-muted-foreground leading-relaxed text-[15px] mt-3">
              Unfortunately, we cannot accept returns on <strong className="text-foreground">sale items</strong> or <strong className="text-foreground">gift cards</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">Exchanges</h2>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">Refunds</h2>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              We will notify you once we've received and inspected your return, and let you know if the refund was approved or not. If approved, you'll be automatically refunded on your original payment method. Please remember it can take some time for your bank or credit card company to process and post the refund.
            </p>
          </div>

        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Email us at{" "}
            <a href="mailto:info@nezalherbocare.com" className="underline hover:text-foreground transition-colors">
              info@nezalherbocare.com
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}