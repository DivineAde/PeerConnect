"use client";

import { useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ProfileEditForm } from "@/features/profile/ProfileEditForm";

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  if (!user) return null;

  return (
    <PageContainer className="py-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit profile
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-surface-raised p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="xl" />
          <div>
            <h2 className="text-lg font-semibold text-ink">{user.name}</h2>
            {user.headline && <p className="text-sm text-ink-muted">{user.headline}</p>}
            {user.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-faint">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {user.location}
              </p>
            )}
          </div>
        </div>

        {user.bio && (
          <div className="mt-6 border-t border-border pt-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">About</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{user.bio}</p>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Account</h3>
          <p className="text-sm text-ink-muted">{user.email}</p>
        </div>
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <ProfileEditForm user={user} onDone={() => setEditing(false)} />
      </Dialog>
    </PageContainer>
  );
}
