"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ConnectionDTO } from "@peerconnect/types";
import { connectionsApi } from "@/lib/api/connections";
import { toast } from "@/lib/toast";
import { PageContainer } from "@/components/layout/PageContainer";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tab = "connections" | "requests" | "sent";

const tabs: { key: Tab; label: string }[] = [
  { key: "connections", label: "Connections" },
  { key: "requests", label: "Requests" },
  { key: "sent", label: "Sent" },
];

export default function ConnectionsPage() {
  // useSearchParams() opts a page out of static rendering unless it's
  // wrapped in Suspense, so the actual page body lives in an inner
  // component below.
  return (
    <Suspense fallback={null}>
      <ConnectionsPageInner />
    </Suspense>
  );
}

function ConnectionsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as Tab) ?? "connections";
  const [activeTab, setActiveTab] = useState<Tab>(
    tabs.some((t) => t.key === initialTab) ? initialTab : "connections"
  );

  const [connections, setConnections] = useState<ConnectionDTO[] | null>(null);
  const [requests, setRequests] = useState<ConnectionDTO[] | null>(null);
  const [sent, setSent] = useState<ConnectionDTO[] | null>(null);
  const [error, setError] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [c, r, s] = await Promise.all([
        connectionsApi.list(),
        connectionsApi.requests(),
        connectionsApi.sent(),
      ]);
      setConnections(c.connections);
      setRequests(r.requests);
      setSent(s.sent);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/connections${tab === "connections" ? "" : `?tab=${tab}`}`);
  }

  async function handleAccept(id: string) {
    setActionLoadingId(id);
    try {
      await connectionsApi.accept(id);
      toast.success("Connection accepted.");
      await load();
    } catch {
      toast.error("That didn't go through. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoadingId(id);
    try {
      await connectionsApi.reject(id);
      toast.success("Request declined.");
      await load();
    } catch {
      toast.error("That didn't go through. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRemove(id: string, message: string) {
    setActionLoadingId(id);
    try {
      await connectionsApi.remove(id);
      toast.success(message);
      await load();
    } catch {
      toast.error("That didn't go through. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const listForTab = { connections, requests, sent }[activeTab];

  return (
    <PageContainer className="py-0">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Connections</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your network and pending requests.</p>
      </div>

      <div role="tablist" aria-label="Connections" className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => selectTab(tab.key)}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors duration-150",
              activeTab === tab.key ? "text-ink" : "text-ink-muted hover:text-ink"
            )}
          >
            {tab.label}
            {tab.key === "requests" && requests && requests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink">
                {requests.length}
              </span>
            )}
            {activeTab === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message="We couldn't load your connections. Please try again." onRetry={load} />
      ) : listForTab === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : listForTab.length === 0 ? (
        <EmptyState
          title={
            activeTab === "connections"
              ? "You don't have any connections yet."
              : activeTab === "requests"
              ? "No pending requests."
              : "You haven't sent any requests."
          }
          description={
            activeTab === "connections"
              ? "Discover people you may know."
              : activeTab === "requests"
              ? "Incoming requests will show up here."
              : "Requests you send will show up here until they're accepted."
          }
          action={
            activeTab !== "requests" && (
              <Link href="/discover">
                <Button size="sm">Find people</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {listForTab.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              primaryAction={
                activeTab === "requests"
                  ? { label: "Accept", loading: actionLoadingId === connection.id, onClick: () => handleAccept(connection.id) }
                  : undefined
              }
              secondaryAction={
                activeTab === "requests"
                  ? { label: "Decline", loading: actionLoadingId === connection.id, onClick: () => handleReject(connection.id) }
                  : activeTab === "sent"
                  ? { label: "Cancel", loading: actionLoadingId === connection.id, onClick: () => handleRemove(connection.id, "Request cancelled.") }
                  : { label: "Remove", loading: actionLoadingId === connection.id, onClick: () => handleRemove(connection.id, "Connection removed.") }
              }
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
