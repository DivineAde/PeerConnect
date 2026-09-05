"use client";

import { useState } from "react";
import { Check, X, UserPlus, Clock, UserMinus } from "lucide-react";
import type { ViewerRelationship } from "@peerconnect/types";
import { connectionsApi } from "@/lib/api/connections";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";

interface ConnectionButtonProps {
  userId: string;
  relationship: ViewerRelationship;
  connectionId: string | null;
  size?: "sm" | "md";
  onChange?: (next: { relationship: ViewerRelationship; connectionId: string | null }) => void;
}

export function ConnectionButton({
  userId,
  relationship,
  connectionId,
  size = "sm",
  onChange,
}: ConnectionButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>, successMessage: string) {
    setLoading(action);
    try {
      await fn();
      toast.success(successMessage);
    } catch {
      toast.error("That didn't go through. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (relationship === "SELF") return null;

  if (relationship === "NONE") {
    return (
      <Button
        size={size}
        loading={loading === "connect"}
        onClick={() =>
          run(
            "connect",
            async () => {
              const { connection } = await connectionsApi.send(userId);
              onChange?.({ relationship: "PENDING_OUTGOING", connectionId: connection.id });
            },
            "Connection request sent."
          )
        }
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        Connect
      </Button>
    );
  }

  if (relationship === "PENDING_OUTGOING") {
    return (
      <Button
        size={size}
        variant="secondary"
        loading={loading === "cancel"}
        onClick={() =>
          connectionId &&
          run(
            "cancel",
            async () => {
              await connectionsApi.remove(connectionId);
              onChange?.({ relationship: "NONE", connectionId: null });
            },
            "Request cancelled."
          )
        }
      >
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        Pending
      </Button>
    );
  }

  if (relationship === "PENDING_INCOMING") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size={size}
          loading={loading === "accept"}
          onClick={() =>
            connectionId &&
            run(
              "accept",
              async () => {
                await connectionsApi.accept(connectionId);
                onChange?.({ relationship: "CONNECTED", connectionId });
              },
              "Connection accepted."
            )
          }
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Accept
        </Button>
        <Button
          size={size}
          variant="secondary"
          loading={loading === "reject"}
          onClick={() =>
            connectionId &&
            run(
              "reject",
              async () => {
                await connectionsApi.reject(connectionId);
                onChange?.({ relationship: "NONE", connectionId: null });
              },
              "Request declined."
            )
          }
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Decline
        </Button>
      </div>
    );
  }

  // CONNECTED
  return (
    <Button
      size={size}
      variant="secondary"
      loading={loading === "remove"}
      onClick={() =>
        connectionId &&
        run(
          "remove",
          async () => {
            await connectionsApi.remove(connectionId);
            onChange?.({ relationship: "NONE", connectionId: null });
          },
          "Connection removed."
        )
      }
    >
      <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
      Connected
    </Button>
  );
}
