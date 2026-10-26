import { Link, useNavigate } from "@tanstack/react-router";
import { Landmark, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, signIn } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Notice } from "./primitives";
import { PasswordInput } from "./password-input";

export function SignInForm({ portal }: { portal: Role }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const official = portal === "official";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      await signIn(email, password, portal, remember);
      navigate({ to: official ? "/official/dashboard" : "/vendor/dashboard" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border bg-card p-1" role="tablist">
        {[
          { to: "/login" as const, label: "Continue as Vendor", icon: Store, active: !official },
          { to: "/official/login" as const, label: "Official Sign In", icon: Landmark, active: official },
        ].map((t) => (
          <Link
            key={t.to}
            to={t.to}
            role="tab"
            aria-selected={t.active}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
              t.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </Link>
        ))}
      </div>

      <form onSubmit={submit} className="surface space-y-5 p-7" noValidate>
        <div>
          <h1 className="text-2xl font-semibold">{official ? "Official sign in" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {official
              ? "For authorized procurement officials. Accounts are provisioned by an administrator."
              : "Sign in to manage your tender submissions."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{official ? "Official email" : "Business email"}</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-secondary hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember me
        </label>
        {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</Button>
        {!official ? (
          <p className="text-center text-sm text-muted-foreground">
            New vendor? <Link to="/register" className="font-medium text-primary hover:underline">Create Account</Link>
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Official accounts cannot be self-registered.</p>
        )}
      </form>

      <div className="mt-5">
        <Notice>
          <b>Demo mode.</b> Sign-in is simulated in your browser and is not production security. Try{" "}
          <code className="font-mono">{DEMO_ACCOUNTS[portal].email}</code> /{" "}
          <code className="font-mono">{DEMO_ACCOUNTS[portal].password}</code>
        </Notice>
      </div>
    </div>
  );
}
