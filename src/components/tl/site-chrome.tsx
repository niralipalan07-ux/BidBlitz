import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./primitives";

const nav = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/features", label: "Features" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-1">
                {n.label}
              </Link>
            ))}
            <Button variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            About TenderLens — an AI-assisted workspace that helps procurement teams compare tender requirements with
            submitted vendor evidence.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">Product</p>
          <Link to="/features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">Company</p>
          <span className="text-muted-foreground">Privacy</span>
          <span className="text-muted-foreground">Terms</span>
          <a href="mailto:hello@tenderlens.example" className="text-muted-foreground hover:text-foreground">Contact</a>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground">
          TenderLens supports document review and does not replace official procurement decisions. TenderLens is not a
          government portal and is not affiliated with any government body.
        </p>
      </div>
    </footer>
  );
}
