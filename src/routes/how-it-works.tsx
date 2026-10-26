import { createFileRoute } from "@tanstack/react-router";
import { HowItWorks } from "@/components/tl/marketing";
import { SiteFooter, SiteHeader } from "@/components/tl/site-chrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — TenderLens" },
      { name: "description", content: "Upload a tender, collect vendor documents, analyze compliance and review findings." },
      { property: "og:title", content: "How It Works — TenderLens" },
      { property: "og:description", content: "Four steps from tender upload to evidence-linked compliance findings." },
    ],
  }),
  component: () => (
    <div>
      <SiteHeader />
      <HowItWorks />
      <SiteFooter />
    </div>
  ),
});
