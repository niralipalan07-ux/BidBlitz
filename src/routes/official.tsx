import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Users,
  FileText,
  History,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, type NavItem } from "@/components/tl/app-shell";
import { Button } from "@/components/ui/button";
import { getSession, signIn, type Session } from "@/lib/auth";

export const Route = createFileRoute("/official")({
  component: OfficialLayout,
});

const officialNav: NavItem[] = [
  { to: "/official/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/official/tenders", label: "Tender Management", icon: FolderKanban },
  { to: "/official/new-analysis", label: "New Analysis", icon: PlusCircle },
  { to: "/official/submissions", label: "Vendor Submissions", icon: Users },
  { to: "/official/reports", label: "Compliance Reports", icon: FileText },
  { to: "/official/history", label: "Analysis History", icon: History },
  { to: "/official/settings", label: "Settings", icon: Settings },
];

function OfficialLayout() {
  const [session, setSession] = useState<Session | null>(getSession());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setSession(getSession());
    window.addEventListener("tl-auth", handler);
    return () => window.removeEventListener("tl-auth", handler);
  }, []);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signIn("official@demo.tenderlens", "demo-official", "official");
      setSession(getSession());
      navigate({ to: "/official/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.role !== "official") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface max-w-md p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pale text-butter-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Authorized Official Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Official accounts require authorized provisioning. Self-registration is disabled for security.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={handleDemoLogin} disabled={loading}>
              {loading ? "Authorizing…" : "Sign In with Provisioned Demo Official"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/official/login">Go to Official Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell items={officialNav} portal="Official Procurement Portal">
      <Outlet />
    </AppShell>
  );
}
