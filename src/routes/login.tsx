import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/tl/auth-layout";
import { SignInForm } from "@/components/tl/sign-in-form";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Vendor Sign In — TenderLens" },
      { name: "description", content: "Sign in to your TenderLens vendor workspace." },
      { property: "og:title", content: "Vendor Sign In — TenderLens" },
      { property: "og:description", content: "Access your tender submissions and compliance findings." },
    ],
  }),
  component: () => (
    <AuthLayout>
      <SignInForm portal="vendor" />
    </AuthLayout>
  ),
});
