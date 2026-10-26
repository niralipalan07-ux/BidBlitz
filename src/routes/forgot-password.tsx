import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/tl/auth-layout";
import { Notice } from "@/components/tl/primitives";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — TenderLens" },
      { name: "description", content: "Request a password reset link for your TenderLens account." },
      { property: "og:title", content: "Reset Password — TenderLens" },
      { property: "og:description", content: "Recover access to your TenderLens account." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  return (
    <AuthLayout>
      <div className="surface space-y-5 p-7">
        <div>
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p>
        </div>
        {sent ? (
          <Notice tone="info">If an account exists for <b>{email}</b>, a reset link will be sent once email delivery is connected.</Notice>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email.");
              setSent(true);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {err && <p className="text-xs text-danger">{err}</p>}
            </div>
            <Button type="submit" className="w-full">Send reset link</Button>
          </form>
        )}
        <Notice>Requires backend integration: password reset emails are not sent in demo mode.</Notice>
        <Link to="/login" className="block text-center text-sm text-primary hover:underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
