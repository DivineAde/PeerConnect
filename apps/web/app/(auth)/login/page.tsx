import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Log in — PeerConnect" };

export default function LoginPage() {
  // LoginForm reads useSearchParams() (to surface a Google OAuth error
  // query param), which opts the page out of static rendering unless
  // wrapped in Suspense.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
