import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/tl/auth-layout";
import { SignInForm } from "@/components/tl/sign-in-form";

export const Route = createFileRoute("/official_/login")({
  head: () => ({
    meta: [
      { title: "Official Sign In — TenderLens" },
      { name: "description", content: "Sign in for authorized procurement officials." },
      { property: "og:title", content: "Official Sign In — TenderLens" },
      { property: "og:description", content: "Workspace for authorized procurement officials." },
    ],
  }),
  component: () => (
    <AuthLayout>
      <SignInForm portal="official" />
    </AuthLayout>
  ),
});
