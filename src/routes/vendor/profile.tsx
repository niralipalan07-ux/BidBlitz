import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, FileCheck, Mail, MapPin, Phone, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Notice } from "@/components/tl/primitives";
import { getVendorProfile, updateVendorProfile } from "@/lib/api";
import type { VendorProfile } from "@/lib/types";

export const Route = createFileRoute("/vendor/profile")({
  component: VendorCompanyProfile,
});

function VendorCompanyProfile() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVendorProfile().then(setProfile);
  }, []);

  const handleChange = (key: keyof VendorProfile, val: string) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await updateVendorProfile(profile);
      toast.success("Company profile updated successfully.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        subtitle="Maintain statutory business registration numbers and authorized contact details for procurement validation."
      />

      <Notice tone="info">
        <b>Security Notice:</b> Information saved here is used for preliminary vendor qualification. Keep your
        GSTIN, PAN, and Udyam registrations consistent with your uploaded certificates.
      </Notice>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Identity */}
        <div className="surface p-6 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
            <Building2 className="h-4 w-4 text-primary" /> Legal Entity &amp; Incorporation
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="comp-trade">Trade / Display Name</Label>
              <Input
                id="comp-trade"
                value={profile.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-legal">Full Registered Legal Name</Label>
              <Input
                id="comp-legal"
                value={profile.legalName}
                onChange={(e) => handleChange("legalName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-cin">Corporate Identity Number (CIN / Reg No.)</Label>
              <Input
                id="comp-cin"
                value={profile.cin}
                onChange={(e) => handleChange("cin", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-turnover">Average Annual Turnover (Last 3 Years)</Label>
              <Input
                id="comp-turnover"
                value={profile.turnoverLast3Years || ""}
                onChange={(e) => handleChange("turnoverLast3Years", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Statutory Identifiers */}
        <div className="surface p-6 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
            <Shield className="h-4 w-4 text-secondary" /> Statutory &amp; Tax Identifiers
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="comp-gstin">Goods &amp; Services Tax (GSTIN)</Label>
              <Input
                id="comp-gstin"
                className="font-mono uppercase"
                value={profile.gstin}
                onChange={(e) => handleChange("gstin", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-pan">Permanent Account Number (PAN)</Label>
              <Input
                id="comp-pan"
                className="font-mono uppercase"
                value={profile.pan}
                onChange={(e) => handleChange("pan", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-udyam">Udyam Registration No. (MSME)</Label>
              <Input
                id="comp-udyam"
                className="font-mono uppercase"
                value={profile.udyam}
                onChange={(e) => handleChange("udyam", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="surface p-6 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 font-display text-base font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> Contact &amp; Registered Address
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="comp-person">Authorized Signatory / Contact Person</Label>
              <Input
                id="comp-person"
                value={profile.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-email">Official Tender Communications Email</Label>
              <Input
                id="comp-email"
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-phone">Business Phone Number</Label>
              <Input
                id="comp-phone"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="comp-address">Registered Business Address</Label>
              <Input
                id="comp-address"
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-city">City</Label>
              <Input
                id="comp-city"
                value={profile.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-state">State / Province</Label>
              <Input
                id="comp-state"
                value={profile.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-pin">Pincode / Postal Code</Label>
              <Input
                id="comp-pin"
                value={profile.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Profile Details"}
          </Button>
        </div>
      </form>
    </div>
  );
}
