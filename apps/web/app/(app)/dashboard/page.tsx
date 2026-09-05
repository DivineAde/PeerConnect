"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Clock } from "lucide-react";
import type { UserWithRelationshipDTO } from "@peerconnect/types";
import { useAuth } from "@/hooks/useAuth";
import { connectionsApi } from "@/lib/api/connections";
import { usersApi } from "@/lib/api/users";
import { PageContainer } from "@/components/layout/PageContainer";
import { UserCard } from "@/components/users/UserCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{ connectionsCount: number; pendingIncomingCount: number } | null>(null);
  const [suggestions, setSuggestions] = useState<UserWithRelationshipDTO[] | null>(null);
  const [error, setError] = useState(false);

  async function load() {
    setError(false);
    try {
      const [summaryRes, discoverRes] = await Promise.all([
        connectionsApi.summary(),
        usersApi.discover(),
      ]);
      setSummary(summaryRes);
      setSuggestions(discoverRes.users.filter((u) => u.relationship === "NONE").slice(0, 3));
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PageContainer className="py-0">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {greeting()}, {user?.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Here&apos;s what&apos;s happening in your network.</p>
      </div>

      {error ? (
        <ErrorState message="We couldn't load your dashboard. Please try again." onRetry={load} />
      ) : (
        <>
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/connections"
              className="flex items-center gap-4 rounded-lg border border-border bg-surface-raised p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-ink-muted">Your network</p>
                {summary ? (
                  <p className="text-xl font-semibold text-ink">{summary.connectionsCount} connections</p>
                ) : (
                  <Skeleton className="mt-1 h-6 w-32" />
                )}
              </div>
            </Link>

            <Link
              href="/connections?tab=requests"
              className="flex items-center gap-4 rounded-lg border border-border bg-surface-raised p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-ink-muted">Pending requests</p>
                {summary ? (
                  <p className="text-xl font-semibold text-ink">{summary.pendingIncomingCount}</p>
                ) : (
                  <Skeleton className="mt-1 h-6 w-10" />
                )}
              </div>
            </Link>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">People you may know</h2>
              <Link href="/discover" className="text-sm text-accent hover:underline">
                See all
              </Link>
            </div>

            {suggestions === null ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-ink-muted">You&apos;re all caught up — no new suggestions right now.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {suggestions.map((u) => (
                  <UserCard key={u.id} user={u} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
