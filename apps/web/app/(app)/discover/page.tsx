"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { UserWithRelationshipDTO } from "@peerconnect/types";
import { usersApi } from "@/lib/api/users";
import { PageContainer } from "@/components/layout/PageContainer";
import { UserCard } from "@/components/users/UserCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserWithRelationshipDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load(q: string) {
    setLoading(true);
    setError(false);
    try {
      const res = await usersApi.discover({ q: q || undefined });
      setUsers(res.users);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Debounce search input so we're not issuing a request on every
  // keystroke.
  useEffect(() => {
    const handle = setTimeout(() => load(query), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <PageContainer className="py-0">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Discover</h1>
        <p className="mt-1 text-sm text-ink-muted">Find people to connect with.</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        <Input
          placeholder="Search by name, role, or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label="Search people"
        />
      </div>

      {error ? (
        <ErrorState message="We couldn't load people to discover. Please try again." onRetry={() => load(query)} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : users && users.length === 0 ? (
        <EmptyState
          title={query ? "No one matches that search" : "No one to discover yet"}
          description={query ? "Try a different name, role, or location." : "Check back soon as more people join."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users?.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
