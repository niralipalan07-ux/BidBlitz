import { CheckCircle2, FileText, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { DOCUMENT_CATEGORIES } from "@/lib/types";
import { fmtSize } from "@/lib/status";
import { cn } from "@/lib/utils";

export interface QueuedFile {
  id: string;
  file: File;
  category: string;
  progress: number;
  error?: string;
}

const MAX = 10 * 1024 * 1024;

export function FileDropzone({
  files,
  onChange,
  multiple = true,
  withCategory = true,
}: {
  files: QueuedFile[];
  onChange: (f: QueuedFile[] | ((prev: QueuedFile[]) => QueuedFile[])) => void;
  multiple?: boolean;
  withCategory?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next: QueuedFile[] = Array.from(list).map((file) => ({
      id: crypto.randomUUID(),
      file,
      category: DOCUMENT_CATEGORIES[6],
      progress: 0,
      error:
        file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")
          ? "Only PDF files are accepted."
          : file.size > MAX
            ? "File exceeds 10 MB."
            : undefined,
    }));
    onChange((prev) => (multiple ? [...prev, ...next] : next.slice(0, 1)));
    // Local read progress (files stay in the browser until a backend is connected).
    next.filter((n) => !n.error).forEach((n) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable)
          onChange((prev) => prev.map((p) => (p.id === n.id ? { ...p, progress: (e.loaded / e.total) * 100 } : p)));
      };
      reader.onload = () => onChange((prev) => prev.map((p) => (p.id === n.id ? { ...p, progress: 100 } : p)));
      reader.readAsArrayBuffer(n.file);
    });
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          drag ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-sage",
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pale text-butter-foreground">
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="mt-3 font-medium">Drag &amp; drop PDF files, or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF only · up to 10 MB per file</p>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          multiple={multiple}
          className="sr-only"
          aria-label="Upload PDF files"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <FileText className={cn("h-5 w-5 shrink-0", f.error ? "text-danger" : "text-primary")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">{fmtSize(f.file.size)}</p>
                  {f.error ? (
                    <p className="text-xs text-danger">{f.error}</p>
                  ) : f.progress < 100 ? (
                    <Progress value={f.progress} className="mt-1 h-1.5" aria-label="Reading file" />
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </p>
                  )}
                </div>
              </div>
              {withCategory && !f.error && (
                <select
                  aria-label={`Category for ${f.file.name}`}
                  value={f.category}
                  onChange={(e) =>
                    onChange((prev) => prev.map((p) => (p.id === f.id ? { ...p, category: e.target.value } : p)))
                  }
                  className="h-9 rounded-lg border bg-card px-2 text-sm"
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => onChange((prev) => prev.filter((p) => p.id !== f.id))}
                className="self-end rounded-lg p-1.5 text-muted-foreground hover:bg-accent sm:self-auto"
                aria-label={`Remove ${f.file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
