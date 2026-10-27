import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/tl/auth-layout";
import { PasswordInput } from "@/components/tl/password-input";
import { Notice } from "@/components/tl/primitives";
import { register } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Vendor Account — TenderLens" },
      { name: "description", content: "Create a TenderLens vendor account to submit tender documents." },
      { property: "og:title", content: "Create Vendor Account — TenderLens" },
      { property: "og:description", content: "Start submitting tender responses with TenderLens." },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "", company: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid business email.";
    if (f.phone.trim().length < 8) er.phone = "Enter a valid contact phone number.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    if (f.company.trim().length < 2) er.company = "Enter your company name.";
    if (!agree) er.agree = "Please accept the terms and privacy policy.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await register(f);
      toast.success("Account created. Please sign in.");
      navigate({ to: "/login" });
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const field = (k: "name" | "email" | "company" | "phone", label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} placeholder={placeholder} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="text-xs text-danger">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthLayout>
      <form onSubmit={submit} className="surface space-y-4 p-7" noValidate>
        <div>
          <h1 className="text-2xl font-semibold">Create vendor account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Officials receive access through authorized provisioning only.</p>
        </div>
        {field("name", "Full name")}
        {field("email", "Business email", "email")}
        {field("company", "Company name")}
        {field("phone", "Business phone number", "tel", "+91 98200 12345")}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" value={f.password} onChange={set("password")} autoComplete="new-password" />
          {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" />
          {errors.confirm && <p className="text-xs text-danger">{errors.confirm}</p>}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
          I agree to the Terms and Privacy Policy.
        </label>
        {errors.agree && <p className="text-xs text-danger">{errors.agree}</p>}
        {errors.form && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create Account"}</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </form>
      <div className="mt-5">
        <Notice>Demo mode: accounts are stored only in this browser. Don't enter real passwords.</Notice>
      </div>
    </AuthLayout>
  );
}
