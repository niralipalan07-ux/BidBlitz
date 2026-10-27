import type { Analysis, Tender } from "./types";
import { STATUS_LABEL } from "./status";

const DISCLAIMER =
  "TenderLens supports preliminary document review and does not replace official procurement decisions. Evidence matching indicates text correspondence and does not verify legal authenticity or validity of certificates.";

const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function downloadCsv(a: Analysis, t?: Tender) {
  const head = [
    "Tender Reference",
    "Tender Title",
    "Vendor Name",
    "Analysis Date",
    "Requirement",
    "Compliance Status",
    "Evidence Located",
    "Source Document",
    "Page Reference",
    "Explanation",
    "Recommended Official Action",
  ];
  const rows = a.findings.map((f) =>
    [
      t?.reference ?? "",
      t?.title ?? "",
      a.vendorName,
      new Date(a.createdAt).toLocaleDateString(),
      f.requirement,
      STATUS_LABEL[f.status],
      f.evidence,
      f.sourceDocument ?? "—",
      f.page?.toString() ?? "—",
      f.explanation,
      f.action,
    ]
      .map(esc)
      .join(","),
  );
  const csv = [
    head.map(esc).join(","),
    ...rows,
    "",
    esc("DISCLAIMER: " + DISCLAIMER),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `TenderLens_Report_${t?.reference?.replace(/[\/\\]/g, "_") || a.id}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const h = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  MATCHED: { bg: "#EEF1E6", color: "#414B2B", border: "#A9B18A" },
  MISSING_EVIDENCE: { bg: "#FDF2F2", color: "#BA3D3D", border: "#F5C6C6" },
  REVIEW_REQUIRED: { bg: "#FBF3D2", color: "#665000", border: "#F1D77A" },
  NOT_ASSESSED: { bg: "#F0EFE7", color: "#6A705E", border: "#E6E5DC" },
};

/** Opens a high-fidelity print-ready compliance report matching TenderLens branding. */
export function downloadPdf(a: Analysis, t?: Tender) {
  const w = window.open("", "_blank");
  if (!w) return;

  const matched = a.findings.filter((f) => f.status === "MATCHED").length;
  const missing = a.findings.filter((f) => f.status === "MISSING_EVIDENCE").length;
  const review = a.findings.filter((f) => f.status === "REVIEW_REQUIRED").length;

  const rows = a.findings
    .map((f) => {
      const style = statusStyles[f.status] || statusStyles.NOT_ASSESSED;
      return `<tr>
        <td style="font-weight:600;color:#292D24;">${h(f.requirement)}</td>
        <td>
          <span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:0.5px;background:${style.bg};color:${style.color};border:1px solid ${style.border};">
            ${STATUS_LABEL[f.status]}
          </span>
        </td>
        <td style="color:#292D24;">${h(f.evidence)}</td>
        <td style="color:#6A705E;white-space:nowrap;">${h(f.sourceDocument ?? "—")}${f.page ? `<br/><small>Page ${f.page}</small>` : ""}</td>
        <td style="color:#4A503D;font-size:11px;">${h(f.explanation)}</td>
        <td style="color:#292D24;font-size:11px;">${h(f.action)}</td>
      </tr>`;
    })
    .join("");

  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TenderLens Compliance Audit Report — ${h(t?.reference ?? a.id)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #292D24; background: #FFFFFF; margin: 0; padding: 24px; font-size: 12px; line-height: 1.4; }
    .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #414B2B; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-icon { width: 32px; height: 32px; background: #414B2B; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #F8F7F0; font-weight: bold; font-size: 16px; }
    .brand-name { font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 700; color: #414B2B; margin: 0; }
    .report-meta { text-align: right; font-size: 11px; color: #6A705E; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #F8F7F0; border: 1px solid #E6E5DC; border-radius: 10px; padding: 14px; margin-bottom: 20px; }
    .meta-item dt { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6A705E; font-weight: 600; margin-bottom: 3px; }
    .meta-item dd { font-size: 13px; font-weight: 600; color: #292D24; margin: 0; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { border-radius: 8px; padding: 12px; border: 1px solid #E6E5DC; text-align: center; }
    .kpi-num { font-size: 22px; font-weight: 700; font-family: 'DM Sans', sans-serif; margin: 2px 0 0; }
    .kpi-lbl { font-size: 10px; text-transform: uppercase; color: #6A705E; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th { background: #414B2B; color: #FFFFFF; font-weight: 600; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { border-bottom: 1px solid #E6E5DC; padding: 10px 8px; vertical-align: top; }
    tr:nth-child(even) td { background-color: #FAF9F5; }
    .disclaimer-box { background: #FBF3D2; border-left: 4px solid #F1D77A; padding: 10px 14px; border-radius: 4px; font-size: 11px; color: #4A3E00; margin: 20px 0; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E6E5DC; }
    .sign-box { width: 220px; text-align: center; }
    .sign-line { border-bottom: 1px solid #292D24; height: 35px; margin-bottom: 6px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="brand">
      <div class="brand-icon">TL</div>
      <div>
        <h1 class="brand-name">TenderLens</h1>
        <div style="font-size:11px;color:#747C4D;">AI-Assisted Government Tender Compliance Audit</div>
      </div>
    </div>
    <div class="report-meta">
      <div><b>Audit ID:</b> ${h(a.id)}</div>
      <div><b>Generated:</b> ${new Date(a.createdAt).toLocaleString()}</div>
      <div><b>Status:</b> ${h(a.status)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><dt>Tender Title</dt><dd>${h(t?.title ?? "Official Procurement Tender")}</dd></div>
    <div class="meta-item"><dt>Tender Reference</dt><dd>${h(t?.reference ?? "—")}</dd></div>
    <div class="meta-item"><dt>Procuring Dept</dt><dd>${h(t?.department ?? "Public Procurement Division")}</dd></div>
    <div class="meta-item"><dt>Evaluated Vendor</dt><dd>${h(a.vendorName)}</dd></div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card" style="background:#F8F7F0;">
      <div class="kpi-lbl">Total Requirements</div>
      <div class="kpi-num" style="color:#292D24;">${a.findings.length}</div>
    </div>
    <div class="kpi-card" style="background:#EEF1E6;border-color:#A9B18A;">
      <div class="kpi-lbl" style="color:#414B2B;">Evidence Matched</div>
      <div class="kpi-num" style="color:#414B2B;">${matched}</div>
    </div>
    <div class="kpi-card" style="background:#FDF2F2;border-color:#F5C6C6;">
      <div class="kpi-lbl" style="color:#BA3D3D;">Missing Evidence</div>
      <div class="kpi-num" style="color:#BA3D3D;">${missing}</div>
    </div>
    <div class="kpi-card" style="background:#FBF3D2;border-color:#F1D77A;">
      <div class="kpi-lbl" style="color:#806600;">Requires Official Review</div>
      <div class="kpi-num" style="color:#806600;">${review}</div>
    </div>
  </div>

  <div class="disclaimer-box">
    <b>Mandatory Notice:</b> ${DISCLAIMER}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:16%;">Requirement</th>
        <th style="width:12%;">AI Finding</th>
        <th style="width:20%;">Evidence Located</th>
        <th style="width:14%;">Source Reference</th>
        <th style="width:22%;">Analysis Explanation</th>
        <th style="width:16%;">Recommended Follow-up</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="sign-row">
    <div class="sign-box">
      <div class="sign-line"></div>
      <div style="font-size:10px;color:#6A705E;text-transform:uppercase;">Procurement Evaluation Officer</div>
    </div>
    <div class="sign-box">
      <div class="sign-line"></div>
      <div style="font-size:10px;color:#6A705E;text-transform:uppercase;">Technical Committee Head</div>
    </div>
    <div class="sign-box">
      <div class="sign-line"></div>
      <div style="font-size:10px;color:#6A705E;text-transform:uppercase;">Final Sanctioning Authority</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`);
  w.document.close();
}

