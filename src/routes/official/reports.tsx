import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Eye, FileSpreadsheet, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusPill } from "@/components/tl/primitives";
import { getAnalysis, getTender, listReports } from "@/lib/api";
import { downloadCsv, downloadPdf } from "@/lib/report";
import type { ReportItem } from "@/lib/types";

export const Route = createFileRoute("/official/reports")({
  component: OfficialReports,
});

function OfficialReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listReports().then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  const filtered = reports.filter(
    (r) =>
      r.tenderTitle.toLowerCase().includes(query.toLowerCase()) ||
      r.tenderReference.toLowerCase().includes(query.toLowerCase()) ||
      r.vendorName.toLowerCase().includes(query.toLowerCase()) ||
      r.id.toLowerCase().includes(query.toLowerCase()),
  );

  const handleDownload = async (r: ReportItem, format: "pdf" | "csv") => {
    const analysis = await getAnalysis(r.analysisId);
    const tender = await getTender(r.tenderId);
    if (!analysis) return;
    if (format === "pdf") {
      downloadPdf(analysis, tender);
    } else {
      downloadCsv(analysis, tender);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Reports Repository"
        subtitle="Search, view, and export procurement compliance audit certificates and evidence records."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by tender, reference, vendor, or report ID..."
          className="pl-9"
        />
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Report ID</th>
                <th className="px-4 py-3 font-medium">Tender Title &amp; Ref</th>
                <th className="px-4 py-3 font-medium">Vendor Evaluated</th>
                <th className="px-4 py-3 font-medium">Generated Date</th>
                <th className="px-4 py-3 font-medium">Audit Status</th>
                <th className="px-4 py-3 font-medium">Matched / Missing</th>
                <th className="px-4 py-3 font-medium text-right">Downloads &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-secondary">
                    {r.id}
                  </td>

                  <td className="px-4 py-4 max-w-xs">
                    <p className="font-medium text-foreground truncate">{r.tenderTitle}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.tenderReference}</p>
                  </td>

                  <td className="px-4 py-4 text-xs font-semibold text-foreground">
                    {r.vendorName}
                  </td>

                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-4">
                    <StatusPill tone={r.status === "Analysis Completed" ? "success" : "warning"}>
                      {r.status}
                    </StatusPill>
                  </td>

                  <td className="px-4 py-4 text-xs">
                    <span className="text-primary font-medium">{r.matchedCount} Matched</span> •{" "}
                    <span className="text-danger font-medium">{r.missingCount} Missing</span> •{" "}
                    <span className="text-butter-foreground font-medium">{r.reviewCount} Review</span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/official/analysis/$id" params={{ id: r.analysisId }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(r, "pdf")}>
                        <Download className="mr-1 h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(r, "csv")}>
                        <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> CSV
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No reports match your search query. Run an analysis to generate reports.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
