import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, StatusPill } from "@/components/tl/primitives";
import { addVendorDocument, deleteVendorDocument, getVendorDocuments } from "@/lib/api";
import { DOCUMENT_CATEGORIES, type VendorDocument } from "@/lib/types";

export const Route = createFileRoute("/vendor/documents")({
  component: VendorDocuments,
});

function VendorDocuments() {
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    category: DOCUMENT_CATEGORIES[0] as string,
    validUntil: "2027-12-31",
  });
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVendorDocuments().then((data) => {
      setDocs(data);
      setLoading(false);
    });
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name.trim()) {
      toast.error("Please enter a document name.");
      return;
    }

    setSaving(true);
    try {
      const created = await addVendorDocument({
        name: newDoc.name.endsWith(".pdf") ? newDoc.name : `${newDoc.name}.pdf`,
        category: newDoc.category,
        size: fileObj ? fileObj.size : 256_000,
        validUntil: newDoc.validUntil,
        status: "Active",
      });

      setDocs((prev) => [created, ...prev]);
      toast.success("Document added to your company vault.");
      setShowModal(false);
      setNewDoc({ name: "", category: DOCUMENT_CATEGORIES[0], validUntil: "2027-12-31" });
      setFileObj(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your document vault?`)) return;
    await deleteVendorDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document removed.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Document Vault"
        subtitle="Maintain verified business certificates, statutory registrations, and technical specifications for quick bid attachment."
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Upload New Document
          </Button>
        }
      />

      {/* Quick summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total Vault Files</p>
          <p className="mt-1 font-display text-2xl font-semibold">{docs.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Active Certificates</p>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {docs.filter((d) => d.status === "Active").length}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Categories Registered</p>
          <p className="mt-1 font-display text-2xl font-semibold text-secondary">
            {new Set(docs.map((d) => d.category)).size}
          </p>
        </div>
      </div>

      {/* Document Vault Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Document Title</th>
                <th className="px-4 py-3 font-medium">Category Tag</th>
                <th className="px-4 py-3 font-medium">Uploaded Date</th>
                <th className="px-4 py-3 font-medium">Validity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-2.5 font-medium">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="truncate text-sm">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{(d.size / 1024).toFixed(0)} KB • PDF</p>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-secondary font-medium">{d.category}</td>

                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {new Date(d.uploadedAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {d.validUntil ? `Valid until ${d.validUntil}` : "Perpetual"}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusPill tone={d.status === "Active" ? "success" : "neutral"}>{d.status}</StatusPill>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      aria-label={`Delete ${d.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {docs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No documents uploaded in vault yet. Click "Upload New Document" to add your company files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="surface w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-lg font-semibold">Add Document to Vault</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-title">Document Title / File Name</Label>
                <Input
                  id="doc-title"
                  placeholder="e.g. GST_Registration_2026.pdf"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-cat">Category Classification</Label>
                <select
                  id="doc-cat"
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  className="w-full h-10 rounded-xl border bg-card px-3 text-sm focus:ring-1 focus:ring-primary"
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-validity">Validity Expiration Date (if applicable)</Label>
                <Input
                  id="doc-validity"
                  type="date"
                  value={newDoc.validUntil}
                  onChange={(e) => setNewDoc({ ...newDoc, validUntil: e.target.value })}
                />
              </div>

              <div className="rounded-xl border-2 border-dashed p-4 text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">Select PDF file from device</p>
                <input
                  type="file"
                  accept="application/pdf"
                  className="mt-2 text-xs"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFileObj(e.target.files[0]);
                      if (!newDoc.name) {
                        setNewDoc({ ...newDoc, name: e.target.files[0].name });
                      }
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
