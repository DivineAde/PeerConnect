"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, ArrowLeft } from "lucide-react";
import type { UserWithRelationshipDTO } from "@peerconnect/types";
import { usersApi } from "@/lib/api/users";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConnectionButton } from "@/components/users/ConnectionButton";

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserWithRelationshipDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { user } = await usersApi.getById(params.id);
      setProfile(user);
    } catch {
      setError("We couldn't find that profile.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <PageContainer className="py-0">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </button>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !profile ? (
        <div className="rounded-lg border border-border bg-surface-raised p-8">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-raised p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size="xl" />
              <div>
                <h1 className="text-lg font-semibold text-ink">{profile.name}</h1>
                {profile.headline && <p className="text-sm text-ink-muted">{profile.headline}</p>}
                {profile.location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-faint">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {profile.location}
                  </p>
                )}
              </div>
            </div>
            <ConnectionButton
              userId={profile.id}
              relationship={profile.relationship}
              connectionId={profile.connectionId}
              size="md"
              onChange={(next) => setProfile((p) => (p ? { ...p, ...next } : p))}
            />
          </div>

          {profile.bio && (
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">About</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{profile.bio}</p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
