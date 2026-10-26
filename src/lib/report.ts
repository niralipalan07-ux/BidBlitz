import type { Analysis, Tender } from "./types";
import { STATUS_LABEL } from "./status";

const DISCLAIMER =
  "AI-assisted findings. Final compliance decisions require review by an authorized official. Evidence matching does not verify document authenticity.";

const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function downloadCsv(a: Analysis, t?: Tender) {
  const head = ["Tender Reference", "Vendor", "Requirement", "Status", "Evidence", "Source Document", "Page", "Explanation", "Action"];
  const rows = a.findings.map((f) =>
    [t?.reference ?? "", a.vendorName, f.requirement, STATUS_LABEL[f.status], f.evidence, f.sourceDocument ?? "", f.page?.toString() ?? "", f.explanation, f.action]
      .map(esc)
      .join(","),
  );
  const csv = [head.map(esc).join(","), ...rows, "", esc(DISCLAIMER)].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `tenderlens-${a.id}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const h = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Opens a print-ready report; the user saves it as PDF via the browser print dialog. */
export function downloadPdf(a: Analysis, t?: Tender) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = a.findings
    .map(
      (f) =>
        `<tr><td>${h(f.requirement)}</td><td>${STATUS_LABEL[f.status]}</td><td>${h(f.evidence)}</td><td>${h(f.sourceDocument ?? "—")}</td><td>${f.page ?? "—"}</td><td>${h(f.explanation)}</td></tr>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><title>TenderLens Report ${a.id}</title>
<style>body{font-family:Inter,system-ui,sans-serif;color:#292D24;padding:32px}h1{color:#414B2B;margin:0}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #E6E5DC;padding:8px;text-align:left;vertical-align:top}
th{background:#F8F7F0}.note{background:#FBF3D2;padding:12px;border-radius:8px;margin-top:16px;font-size:12px}</style></head><body>
<h1>TenderLens Compliance Report</h1>
<p><b>Tender:</b> ${h(t?.title ?? "")}<br/><b>Reference:</b> ${h(t?.reference ?? "")}<br/><b>Vendor:</b> ${h(a.vendorName)}<br/><b>Analysis date:</b> ${new Date(a.createdAt).toLocaleString()}</p>
<div class="note">${DISCLAIMER}</div>
<table><thead><tr><th>Requirement</th><th>Status</th><th>Evidence</th><th>Source</th><th>Page</th><th>Explanation</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
