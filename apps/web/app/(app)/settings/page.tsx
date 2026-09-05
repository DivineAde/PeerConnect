"use client";

import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "@/components/layout/PageContainer";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <PageContainer className="py-0">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your account and preferences.</p>
      </div>

      <div className="max-w-lg space-y-6">
        <section className="rounded-lg border border-border bg-surface-raised p-6">
          <h2 className="text-sm font-semibold text-ink">Appearance</h2>
          <p className="mt-1 text-sm text-ink-muted">Choose how PeerConnect looks on this device.</p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface-raised p-6">
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Email</dt>
              <dd className="text-ink">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Member since</dt>
              <dd className="text-ink">
                {user && new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface-raised p-6">
          <h2 className="text-sm font-semibold text-ink">Session</h2>
          <p className="mt-1 text-sm text-ink-muted">Log out of PeerConnect on this device.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
