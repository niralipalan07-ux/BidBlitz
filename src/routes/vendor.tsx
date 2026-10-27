import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileSearch,
  ClipboardCheck,
  FolderCheck,
  BarChart3,
  Building2,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, type NavItem } from "@/components/tl/app-shell";
import { Button } from "@/components/ui/button";
import { getSession, signIn, type Session } from "@/lib/auth";

export const Route = createFileRoute("/vendor")({
  component: VendorLayout,
});

const vendorNav: NavItem[] = [
  { to: "/vendor/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/vendor/tenders", label: "Available Tenders", icon: FileSearch },
  { to: "/vendor/submissions", label: "My Submissions", icon: ClipboardCheck },
  { to: "/vendor/documents", label: "Documents", icon: FolderCheck },
  { to: "/vendor/reports", label: "Reports", icon: BarChart3 },
  { to: "/vendor/profile", label: "Company Profile", icon: Building2 },
  { to: "/vendor/settings", label: "Settings", icon: Settings },
];

function VendorLayout() {
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
      await signIn("vendor@demo.tenderlens", "demo-vendor", "vendor");
      setSession(getSession());
      navigate({ to: "/vendor/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.role !== "vendor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface max-w-md p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pale text-butter-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Vendor Portal Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in with a registered vendor account to view tenders and manage submissions.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={handleDemoLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In with Demo Vendor Account"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Go to Login Page</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell items={vendorNav} portal="Vendor Portal">
      <Outlet />
    </AppShell>
  );
}
