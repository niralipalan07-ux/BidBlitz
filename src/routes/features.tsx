import { createFileRoute } from "@tanstack/react-router";
import { Features } from "@/components/tl/marketing";
import { SiteFooter, SiteHeader } from "@/components/tl/site-chrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — TenderLens" },
      { name: "description", content: "Requirement-level checks, missing-document detection, evidence-linked explanations and reports." },
      { property: "og:title", content: "Features — TenderLens" },
      { property: "og:description", content: "Everything procurement teams need for careful, accountable tender review." },
    ],
  }),
  component: () => (
    <div>
      <SiteHeader />
      <Features />
      <SiteFooter />
    </div>
  ),
});
