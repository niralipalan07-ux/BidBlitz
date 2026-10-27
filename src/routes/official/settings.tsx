import { createFileRoute } from "@tanstack/react-router";
import { Building2, Lock, RotateCcw, ShieldCheck, Sliders, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Notice } from "@/components/tl/primitives";
import { resetDemoData } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/official/settings")({
  component: OfficialSettings,
});

function OfficialSettings() {
  const session = getSession();
  const [requireDualSignoff, setRequireDualSignoff] = useState(true);
  const [enforceOcrScan, setEnforceOcrScan] = useState(true);
  const [deptName, setDeptName] = useState("Central State Public Procurement Directorate");

  const handleReset = () => {
    if (confirm("Reset all prototype data to initial defaults?")) {
      resetDemoData();
      toast.success("Demo store reset to defaults. Reloading...");
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Procurement Department Settings"
        subtitle="Configure compliance evaluation rules, authorized officer parameters, and audit controls."
      />

      {/* Official Identity */}
      <div className="surface p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
          <User className="h-4 w-4 text-primary" /> Authorized Official Profile
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Authorized Officer</p>
            <p className="font-medium mt-0.5">{session?.name || "Demo Official"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Official Email</p>
            <p className="font-medium mt-0.5 font-mono">{session?.email || "official@demo.tenderlens"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Privilege Tier</p>
            <p className="font-medium mt-0.5 text-primary font-semibold">Authorized Procurement Evaluator</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Provisioning Method</p>
            <p className="font-medium mt-0.5">Administrative Provisioning (No Public Registration)</p>
          </div>
        </div>
      </div>

      {/* Department Configuration */}
      <div className="surface p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
          <Building2 className="h-4 w-4 text-secondary" /> Procuring Entity Information
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name">Procuring Directorate / Department Header</Label>
            <Input
              id="dept-name"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-disclaimer">Standard Audit Certificate Disclaimer</Label>
            <textarea
              id="audit-disclaimer"
              rows={3}
              readOnly
              className="w-full rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground font-mono focus:outline-none"
              value="TenderLens supports document review and does not replace official procurement decisions. Evidence matching indicates text correspondence and does not verify legal authenticity."
            />
          </div>
          <Button size="sm" onClick={() => toast.success("Department configuration saved.")}>
            Save Entity Details
          </Button>
        </div>
      </div>

      {/* Compliance Engine Policies */}
      <div className="surface p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
          <Sliders className="h-4 w-4 text-primary" /> Evaluation Policies &amp; Thresholds
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer text-sm">
            <Checkbox checked={requireDualSignoff} onCheckedChange={(c) => setRequireDualSignoff(!!c)} />
            <span>Require dual sign-off on bids with MISSING EVIDENCE flags before rejection</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-sm">
            <Checkbox checked={enforceOcrScan} onCheckedChange={(c) => setEnforceOcrScan(!!c)} />
            <span>Enable automated text &amp; table extraction (PyMuPDF / OCR) for scanned certificates</span>
          </label>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast.success("Evaluation policies updated.")}>
          Update Policies
        </Button>
      </div>

      {/* Prototype Reset */}
      <div className="surface p-6 space-y-4 border-l-4 border-l-butter">
        <div className="flex items-center gap-2 font-display text-base font-semibold">
          <RotateCcw className="h-4 w-4 text-butter-foreground" /> Reset Prototype Demo Data
        </div>
        <p className="text-xs text-muted-foreground">
          Reset all tenders, submissions, and compliance analysis records back to the initial demo state.
        </p>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset Prototype Store
        </Button>
      </div>
    </div>
  );
}
