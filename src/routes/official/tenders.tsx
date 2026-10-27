import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building,
  Calendar,
  FilePlus,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, StatusPill } from "@/components/tl/primitives";
import { createTender, deleteTender, listAllSubmissions, listTenders } from "@/lib/api";
import { DOCUMENT_CATEGORIES, type Submission, type Tender } from "@/lib/types";

export const Route = createFileRoute("/official/tenders")({
  component: OfficialTenders,
});

function OfficialTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New tender form state
  const [form, setForm] = useState({
    title: "",
    reference: "",
    department: "",
    deadline: "2026-12-31T17:00",
    description: "",
    eligibility: "Valid GST registration\nMinimum average annual turnover of ₹1 Crore\nPast experience in relevant domain",
    requiredDocs: ["GST Certificate", "PAN Document", "Technical Specifications"] as string[],
    technical: "Standard equipment warranty 3 years\n99.5% service uptime SLA",
  });

  useEffect(() => {
    Promise.all([listTenders(), listAllSubmissions()]).then(([t, s]) => {
      setTenders(t);
      setSubmissions(s);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.reference.trim() || !form.department.trim()) {
      toast.error("Please fill in the title, reference number, and department.");
      return;
    }

    setSaving(true);
    try {
      const created = await createTender({
        title: form.title,
        reference: form.reference,
        department: form.department,
        deadline: new Date(form.deadline).toISOString(),
        description: form.description,
        eligibility: form.eligibility.split("\n").filter((x) => x.trim().length > 0),
        requiredDocuments: form.requiredDocs,
        technical: form.technical.split("\n").filter((x) => x.trim().length > 0),
      });

      setTenders((prev) => [created, ...prev]);
      toast.success("Tender published to vendor portal.");
      setShowModal(false);
      setForm({
        title: "",
        reference: "",
        department: "",
        deadline: "2026-12-31T17:00",
        description: "",
        eligibility: "Valid GST registration\nMinimum average annual turnover of ₹1 Crore",
        requiredDocs: ["GST Certificate", "PAN Document", "Technical Specifications"],
        technical: "Standard equipment warranty 3 years",
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, ref: string) => {
    if (!confirm(`Delete tender ${ref}? This will remove it from the vendor portal.`)) return;
    await deleteTender(id);
    setTenders((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tender deleted.");
  };

  const filtered = tenders.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.reference.toLowerCase().includes(query.toLowerCase()) ||
      t.department.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tender Management"
        subtitle="Publish procurement notices, configure statutory requirement checklists, and monitor vendor submissions."
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create New Tender
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tenders by title, reference, or department..."
          className="pl-9"
        />
      </div>

      {/* Tenders Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Reference &amp; Title</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Submissions Received</th>
                <th className="px-4 py-3 font-medium">Requirements</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => {
                const bidCount = submissions.filter((s) => s.tenderId === t.id).length;
                return (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold uppercase text-secondary">
                        {t.reference}
                      </span>
                      <p className="font-medium text-foreground mt-0.5">{t.title}</p>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                      <Building className="h-3.5 w-3.5" /> {t.department}
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(t.deadline).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4 text-xs font-medium">
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-primary">
                        {bidCount} Vendor Bids
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {t.requiredDocuments.length} Document(s)
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/official/submissions">View Bids</Link>
                        </Button>
                        <button
                          onClick={() => handleDelete(t.id, t.reference)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                          aria-label={`Delete ${t.reference}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No tenders found. Click "Create New Tender" to publish your first tender notice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tender Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 overflow-y-auto">
          <div className="surface w-full max-w-2xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Create Tender Notice</h2>
                <p className="text-xs text-muted-foreground">Define tender scope, deadlines, and required statutory documents</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="t-title">Tender Title</Label>
                  <Input
                    id="t-title"
                    placeholder="e.g. Procurement of Network Routing Switches for Data Center"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="t-ref">Tender Reference Number</Label>
                  <Input
                    id="t-ref"
                    placeholder="e.g. DEMO/IT/2026/089"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="t-dept">Procuring Department</Label>
                  <Input
                    id="t-dept"
                    placeholder="e.g. Department of Information Technology"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="t-deadline">Submission Deadline</Label>
                  <Input
                    id="t-deadline"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="t-desc">Tender Description &amp; Scope</Label>
                  <Textarea
                    id="t-desc"
                    rows={3}
                    placeholder="Brief description of supply, works, or service requirements..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Required Documents Selector */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Required Documents Checklist</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 bg-muted/20">
                    {DOCUMENT_CATEGORIES.map((cat) => {
                      const selected = form.requiredDocs.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, requiredDocs: [...form.requiredDocs, cat] });
                              } else {
                                setForm({
                                  ...form,
                                  requiredDocs: form.requiredDocs.filter((c) => c !== cat),
                                });
                              }
                            }}
                            className="rounded border"
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="t-elig">Eligibility Criteria (one per line)</Label>
                  <Textarea
                    id="t-elig"
                    rows={3}
                    value={form.eligibility}
                    onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="t-tech">Technical Criteria (one per line)</Label>
                  <Textarea
                    id="t-tech"
                    rows={2}
                    value={form.technical}
                    onChange={(e) => setForm({ ...form, technical: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Publishing…" : "Publish Tender"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
