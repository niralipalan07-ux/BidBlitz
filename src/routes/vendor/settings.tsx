import { createFileRoute } from "@tanstack/react-router";
import { Bell, Lock, RotateCcw, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Notice } from "@/components/tl/primitives";
import { resetDemoData } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/vendor/settings")({
  component: VendorSettings,
});

function VendorSettings() {
  const session = getSession();
  const [notifyAnalysis, setNotifyAnalysis] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [notifyMissing, setNotifyMissing] = useState(true);

  const handleReset = () => {
    if (confirm("Reset demo data to initial defaults? All simulated submissions and uploads will be reset.")) {
      resetDemoData();
      toast.success("Demo store reset to default data. Reloading page...");
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account &amp; System Settings"
        subtitle="Manage communication preferences, platform security, and preview workspace settings."
      />

      <div className="space-y-6 max-w-2xl">
        {/* User Account Info */}
        <div className="surface p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
            <User className="h-4 w-4 text-primary" /> Active Vendor Account
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Authorized User</p>
              <p className="font-medium mt-0.5">{session?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Business Email</p>
              <p className="font-medium mt-0.5">{session?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Company Entity</p>
              <p className="font-medium mt-0.5">{session?.company}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Role</p>
              <p className="font-medium mt-0.5 uppercase text-secondary">Vendor</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="surface p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
            <Bell className="h-4 w-4 text-secondary" /> Notification Alerts
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer text-sm">
              <Checkbox checked={notifyAnalysis} onCheckedChange={(c) => setNotifyAnalysis(!!c)} />
              <span>Email notification when procurement officers run compliance analysis on your bids</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm">
              <Checkbox checked={notifyMissing} onCheckedChange={(c) => setNotifyMissing(!!c)} />
              <span>Urgent alert when missing documents or clarifications are flagged</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm">
              <Checkbox checked={notifyDeadline} onCheckedChange={(c) => setNotifyDeadline(!!c)} />
              <span>Reminders 48 hours prior to tender submission closing deadlines</span>
            </label>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.success("Notification preferences saved.")}>
            Save Notification Preferences
          </Button>
        </div>

        {/* Password & Security */}
        <div className="surface p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
            <Lock className="h-4 w-4 text-primary" /> Security &amp; Credentials
          </div>
          <p className="text-xs text-muted-foreground">
            In prototype demo mode, authentication is simulated in the browser. Replace with FastAPI production JWT
            endpoints when deployed.
          </p>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="curr-pass">Current Password</Label>
            <Input id="curr-pass" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="new-pass">New Password</Label>
            <Input id="new-pass" type="password" placeholder="••••••••" />
          </div>
          <Button size="sm" onClick={() => toast.success("Password updated in local demo session.")}>
            Update Password
          </Button>
        </div>

        {/* Prototype Reset */}
        <div className="surface p-6 space-y-4 border-l-4 border-l-butter">
          <div className="flex items-center gap-2 font-display text-base font-semibold">
            <RotateCcw className="h-4 w-4 text-butter-foreground" /> Reset Prototype Demo Data
          </div>
          <p className="text-xs text-muted-foreground">
            Reset all tenders, submissions, vault documents, and compliance findings back to the initial demo state.
          </p>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Demo Data Store
          </Button>
        </div>
      </div>
    </div>
  );
}
