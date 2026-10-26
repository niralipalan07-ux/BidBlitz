import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPreview, Features, HowItWorks } from "@/components/tl/marketing";
import { SiteFooter, SiteHeader } from "@/components/tl/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TenderLens — Smarter Tender Compliance" },
      { name: "description", content: "Analyze tender requirements, review vendor documents and identify compliance gaps with AI-assisted analysis." },
      { property: "og:title", content: "TenderLens — Smarter Tender Compliance" },
      { property: "og:description", content: "AI-assisted tender compliance review for procurement teams and vendors." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div className="fade-up">
          <span className="inline-flex rounded-full border border-butter bg-pale px-3 py-1 text-xs font-medium text-butter-foreground">
            AI-assisted procurement review
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Smarter Tender Compliance. <span className="text-secondary">Clearer Decisions.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Analyze tender requirements, review vendor documentation, and identify compliance gaps with AI-assisted document analysis.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/register">Get Started <ArrowRight /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/how-it-works">Explore How It Works</Link>
            </Button>
          </div>
        </div>
        <DashboardPreview />
      </section>
      <HowItWorks />
      <Features />
      <SiteFooter />
    </div>
  );
}
