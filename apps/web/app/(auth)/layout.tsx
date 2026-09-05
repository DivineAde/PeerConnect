import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <Link href="/" className="mb-8 text-[15px] font-semibold tracking-tight text-ink">
        PeerConnect
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
