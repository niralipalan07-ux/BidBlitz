import { BarChart3, FileSearch, FileText, FileWarning, FolderUp, ListChecks, ScanSearch, ShieldCheck, Upload, Users } from "lucide-react";
import { StatusPill } from "./primitives";

const steps = [
  { icon: Upload, title: "Upload Tender", body: "Extract requirements from the tender document." },
  { icon: FolderUp, title: "Submit Documents", body: "Collect vendor certificates and technical documents." },
  { icon: ScanSearch, title: "Analyze Compliance", body: "Compare requirements against available evidence." },
  { icon: ListChecks, title: "Review Results", body: "Identify matched evidence, missing documents, and items requiring human review." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <p className="text-sm font-medium uppercase tracking-widest text-secondary">How it works</p>
      <h2 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">Four calm steps from tender to findings.</h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="surface p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><s.icon className="h-5 w-5" /></span>
              <span className="font-display text-sm text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const features = [
  { icon: FileSearch, title: "AI-assisted document analysis", body: "Read tender PDFs and vendor bundles to surface relevant passages." },
  { icon: ListChecks, title: "Requirement-by-requirement checks", body: "Every clause gets its own status, evidence and explanation." },
  { icon: FileWarning, title: "Missing-document identification", body: "See instantly which required documents were not supplied." },
  { icon: FileText, title: "Evidence-linked explanations", body: "Each finding cites the source document and page reference." },
  { icon: BarChart3, title: "PDF & CSV reports", body: "Export review-ready reports with disclaimers built in." },
  { icon: Users, title: "Role-based workspaces", body: "Separate, isolated spaces for vendors and procurement officials." },
];

export function Features() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-secondary">Features</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">Built for careful, accountable review.</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-7 transition-colors hover:bg-background">
              <f.icon className="h-5 w-5 text-secondary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-pale p-5 text-sm text-butter-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Evidence matching is not authenticity verification. TenderLens highlights where supporting text was found; officials make every final decision.
        </div>
      </div>
    </section>
  );
}

export function DashboardPreview() {
  const rows = [
    { r: "GST Certificate", s: "MATCHED", t: "success" as const },
    { r: "OEM Authorization", s: "MISSING EVIDENCE", t: "danger" as const },
    { r: "Technical Specifications", s: "REVIEW REQUIRED", t: "warning" as const },
  ];
  return (
    <div className="relative" aria-label="Product preview (illustrative)">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-sage/25 leaf-pattern" />
      <div className="surface p-5 shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold">Compliance summary</p>
          <span className="text-xs text-muted-foreground">DEMO/IT/2026/014</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Checked", "12", "bg-accent"],
            ["Matched", "8", "bg-primary-soft"],
            ["Review", "3", "bg-pale"],
          ].map(([l, v, c]) => (
            <div key={l} className={`rounded-xl p-3 ${c}`}>
              <p className="text-[11px] text-muted-foreground">{l}</p>
              <p className="font-display text-xl font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed p-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-butter text-butter-foreground"><Upload className="h-4 w-4" /></span>
          <div className="text-xs">
            <p className="font-medium">Technical.pdf</p>
            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-primary" /></div>
          </div>
        </div>
        <div className="mt-4 divide-y rounded-xl border">
          {rows.map((x) => (
            <div key={x.r} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <span>{x.r}</span>
              <StatusPill tone={x.t}>{x.s}</StatusPill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
