import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account — PeerConnect" };

export default function RegisterPage() {
  return <RegisterForm />;
}
