import { createFileRoute, Link } from "@tanstack/react-router";
import { Building, Calendar, FileText, Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/tl/primitives";
import { listTenders } from "@/lib/api";
import type { Tender } from "@/lib/types";

export const Route = createFileRoute("/vendor/tenders")({
  component: VendorTenders,
});

function VendorTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTenders().then((data) => {
      setTenders(data);
      setLoading(false);
    });
  }, []);

  const departments = Array.from(new Set(tenders.map((t) => t.department)));

  const filtered = tenders.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.reference.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase());
    const matchesDept = selectedDept === "ALL" || t.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Tenders"
        subtitle="Explore active procurement tenders and submit your compliance documentation."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tender title, keyword, or reference..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="dept-select" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Department:
          </label>
          <select
            id="dept-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-10 rounded-xl border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tender Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((tender) => {
          const daysLeft = Math.ceil(
            (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          return (
            <div
              key={tender.id}
              className="surface flex flex-col justify-between p-6 transition-all hover:shadow-[var(--shadow-lift)]"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs font-semibold uppercase text-secondary">
                    {tender.reference}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                      daysLeft > 10
                        ? "bg-primary-soft text-primary border-primary/20"
                        : "bg-pale text-butter-foreground border-butter"
                    }`}
                  >
                    {daysLeft > 0 ? `${daysLeft} days remaining` : "Closing soon"}
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-semibold leading-snug">{tender.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building className="h-3.5 w-3.5" /> {tender.department}
                </p>

                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {tender.description}
                </p>

                {/* Required Documents Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tender.requiredDocuments.slice(0, 3).map((doc) => (
                    <span
                      key={doc}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {doc}
                    </span>
                  ))}
                  {tender.requiredDocuments.length > 3 && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      +{tender.requiredDocuments.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Due: {new Date(tender.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/vendor/tenders/$id" params={{ id: tender.id }}>
                      View Details
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/vendor/submit/$id" params={{ id: tender.id }}>
                      Submit Bid <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="surface p-12 text-center">
          <p className="font-display text-lg font-semibold">No tenders match your criteria</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing your search filters or check back later.</p>
        </div>
      )}
    </div>
  );
}
