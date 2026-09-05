"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { UserWithRelationshipDTO } from "@peerconnect/types";
import { Avatar } from "@/components/ui/Avatar";
import { ConnectionButton } from "./ConnectionButton";

export function UserCard({ user }: { user: UserWithRelationshipDTO }) {
  const [state, setState] = useState({
    relationship: user.relationship,
    connectionId: user.connectionId,
  });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-5 transition-colors duration-150 hover:border-border-strong">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${user.id}`}>
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
        </Link>
        <div className="min-w-0">
          <Link href={`/profile/${user.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">
            {user.name}
          </Link>
          {user.headline && <p className="truncate text-sm text-ink-muted">{user.headline}</p>}
          {user.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {user.location}
            </p>
          )}
        </div>
      </div>

      <ConnectionButton
        userId={user.id}
        relationship={state.relationship}
        connectionId={state.connectionId}
        onChange={setState}
      />
    </div>
  );
}
