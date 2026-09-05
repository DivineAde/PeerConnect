"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { Sidebar } from "./Sidebar";

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
          <Link href="/dashboard" className="text-[15px] font-semibold tracking-tight text-ink">
            PeerConnect
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2" aria-label="Your profile">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
              </Link>
              <button
                onClick={() => logout()}
                className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink sm:flex"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-bg px-4 py-3 md:hidden">
          <Sidebar />
          <button
            onClick={() => logout()}
            className="mt-2 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-surface hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
