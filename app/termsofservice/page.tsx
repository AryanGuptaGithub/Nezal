// app/termsofservice/page.tsx
import Link from "next/link"

export const metadata = {
  title: "Terms of Service | Nezal Herbocare",
  description: "Terms of Service for Nezal Herbocare",
}

const sections = [
  {
    id: "section-1",
    title: "Section 1 – Online Store Terms",
    content: `By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you have given us your consent to allow any of your minor dependents to use this site.\n\nYou may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).\n\nYou must not transmit any worms or viruses or any code of a destructive nature. A breach or violation of any of the Terms will result in an immediate termination of your Services.`,
  },
  {
    id: "section-2",
    title: "Section 2 – General Conditions",
    content: `We reserve the right to refuse service to anyone for any reason at any time.\n\nYou agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service without express written permission by us.\n\nCredit card information is always encrypted during transfer over networks.`,
  },
  {
    id: "section-3",
    title: "Section 3 – Accuracy, Completeness and Timeliness of Information",
    content: `We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon as the sole basis for making decisions.\n\nWe reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site.`,
  },
  {
    id: "section-4",
    title: "Section 4 – Modifications to the Service and Prices",
    content: `Prices for our products are subject to change without notice.\n\nWe reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.`,
  },
  {
    id: "section-5",
    title: "Section 5 – Products or Services",
    content: `Certain products or services may be available exclusively online through the website and may have limited quantities subject to our Return Policy.\n\nWe reserve the right to limit the sales of our products or Services to any person, geographic region or jurisdiction. We reserve the right to discontinue any product at any time.`,
  },
  {
    id: "section-6",
    title: "Section 6 – Accuracy of Billing and Account Information",
    content: `We reserve the right to refuse any order you place with us. We may limit or cancel quantities purchased per person, per household or per order.\n\nYou agree to provide current, complete and accurate purchase and account information for all purchases made at our store.`,
  },
  {
    id: "section-7",
    title: "Section 7 – Optional Tools",
    content: `We may provide you with access to third-party tools over which we neither monitor nor have any control. Such tools are provided "as is" and "as available" without any warranties. Any use of optional tools offered through the site is entirely at your own risk and discretion.`,
  },
  {
    id: "section-8",
    title: "Section 8 – Third-Party Links",
    content: `Certain content, products and services available via our Service may include materials from third parties. Third-party links on this site may direct you to third-party websites that are not affiliated with us.\n\nWe are not responsible for examining or evaluating the content or accuracy of third-party websites, and will not have any liability or responsibility for any third-party materials or websites.`,
  },
  {
    id: "section-9",
    title: "Section 9 – User Comments, Feedback and Other Submissions",
    content: `If you send us creative ideas, suggestions, proposals, plans, or other materials, you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us.\n\nYou agree that your comments will not violate any right of any third party, including copyright, trademark, privacy, personality or other personal or proprietary right.`,
  },
  {
    id: "section-10",
    title: "Section 10 – Personal Information",
    content: `Your submission of personal information through the store is governed by our Privacy Policy.`,
  },
  {
    id: "section-11",
    title: "Section 11 – Errors, Inaccuracies and Omissions",
    content: `Occasionally there may be information on our site that contains typographical errors, inaccuracies or omissions that may relate to product descriptions, pricing, promotions, offers, shipping charges, transit times and availability. We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel orders if any information is inaccurate at any time without prior notice.`,
  },
  {
    id: "section-12",
    title: "Section 12 – Prohibited Uses",
    content: `You are prohibited from using the site or its content for any unlawful purpose; to solicit others to perform unlawful acts; to violate any regulations, rules, or laws; to infringe upon intellectual property rights; to harass, abuse, insult, harm, defame, or discriminate; to submit false or misleading information; to upload viruses or malicious code; to collect or track personal information of others; to spam or scrape; or to interfere with the security features of the Service.\n\nWe reserve the right to terminate your use of the Service for violating any of the prohibited uses.`,
  },
  {
    id: "section-13",
    title: "Section 13 – Disclaimer of Warranties; Limitation of Liability",
    content: `We do not guarantee that your use of our service will be uninterrupted, timely, secure or error-free.\n\nIn no case shall Nezal Herbocare, our directors, officers, employees, affiliates, agents, contractors, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind arising from your use of the service or any products procured using the service.`,
  },
  {
    id: "section-14",
    title: "Section 14 – Indemnification",
    content: `You agree to indemnify, defend and hold harmless Nezal Herbocare and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your breach of these Terms of Service or your violation of any law or the rights of a third party.`,
  },
  {
    id: "section-15",
    title: "Section 15 – Severability",
    content: `In the event that any provision of these Terms of Service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms of Service.`,
  },
  {
    id: "section-16",
    title: "Section 16 – Termination",
    content: `These Terms of Service are effective unless and until terminated by either you or us. If in our sole judgment you fail to comply with any term or provision of these Terms of Service, we may terminate this agreement at any time without notice and you will remain liable for all amounts due up to and including the date of termination.`,
  },
  {
    id: "section-17",
    title: "Section 17 – Entire Agreement",
    content: `These Terms of Service and any policies or operating rules posted by us on this site constitute the entire agreement and understanding between you and us and govern your use of the Service, superseding any prior or contemporaneous agreements, communications and proposals, whether oral or written, between you and us.`,
  },
  {
    id: "section-18",
    title: "Section 18 – Governing Law",
    content: `These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of courts located in the State of Maharashtra.`,
  },
  {
    id: "section-19",
    title: "Section 19 – Changes to Terms of Service",
    content: `We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website. Your continued use of or access to our website following the posting of any changes constitutes acceptance of those changes.`,
  },
  {
    id: "section-20",
    title: "Section 20 – Contact Information",
    content: `Questions about the Terms of Service should be sent to us at info@nezalherbocare.com`,
  },
]

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-[#f9f6f1] border-b border-border py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span>Terms of Service</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-3">Last updated: September 14, 2020</p>
        </div>
      </div>

      {/* Overview */}
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-0">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-10">
          <h2 className="font-semibold text-foreground mb-2">Overview</h2>
          <p className="text-muted-foreground text-[14px] leading-relaxed">
            This website is operated by Nezal Herbocare. By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions. These Terms of Service apply to all users of the site, including browsers, vendors, customers, merchants, and contributors of content.
          </p>
          <p className="text-muted-foreground text-[14px] leading-relaxed mt-2">
            Please read these Terms of Service carefully before accessing or using our website.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.id} id={section.id}>
              <h2 className="text-xl font-semibold text-foreground mb-3">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-[15px] whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
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