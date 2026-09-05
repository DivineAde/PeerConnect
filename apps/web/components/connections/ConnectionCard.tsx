"use client";

import Link from "next/link";
import type { ConnectionDTO } from "@peerconnect/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { relativeTime } from "@/lib/utils";

interface ConnectionCardProps {
  connection: ConnectionDTO;
  primaryAction?: { label: string; onClick: () => void; loading?: boolean };
  secondaryAction?: { label: string; onClick: () => void; loading?: boolean };
}

export function ConnectionCard({ connection, primaryAction, secondaryAction }: ConnectionCardProps) {
  const { user } = connection;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-raised px-4 py-3">
      <Link href={`/profile/${user.id}`} className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-muted">
            {user.headline ?? "PeerConnect member"} · {relativeTime(connection.updatedAt)}
          </p>
        </div>
      </Link>

      {(primaryAction || secondaryAction) && (
        <div className="flex shrink-0 items-center gap-2">
          {secondaryAction && (
            <Button size="sm" variant="secondary" loading={secondaryAction.loading} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button size="sm" loading={primaryAction.loading} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
