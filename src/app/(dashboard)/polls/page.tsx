"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Trophy } from "lucide-react";
import { Fragment, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  CellText,
  DataTable,
  DataTableHead,
  DataTableShell,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getPollRegistry } from "@/lib/api";
import type { RegistryPoll } from "@/types";
import { formatDateTime } from "@/lib/utils";

const SOURCE_LABELS: Record<RegistryPoll["source"], string> = {
  chat: "Chat",
  food: "Food",
};

function PollOptionsDetail({ poll }: { poll: RegistryPoll }) {
  return (
    <div className="space-y-2 px-4 py-3">
      {poll.options.map((option) => {
        const percent =
          poll.total_votes > 0
            ? Math.round((option.vote_count / poll.total_votes) * 100)
            : 0;
        const isWinner = poll.winner_option_ids.includes(option.id);

        return (
          <div
            key={option.id}
            className={`rounded-xl border px-3 py-2 ${
              isWinner
                ? "border-primary bg-primary-soft"
                : "border-theme bg-panel"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {isWinner && poll.winner_option_ids.length > 0 && (
                  <Trophy className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
                <span className="truncate text-sm font-medium text-heading">
                  {option.text}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {option.vote_count} ({percent}%)
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-elevated">
              <div
                className={`h-full rounded-full ${
                  isWinner ? "gradient-bar" : "bg-secondary/40"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PollsPage() {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const registryQuery = useQuery({
    queryKey: ["poll-registry"],
    queryFn: getPollRegistry,
    refetchInterval: 5000,
  });

  if (registryQuery.isLoading) return <LoadingSpinner />;

  const polls = registryQuery.data ?? [];

  const toggleRow = (poll: RegistryPoll) => {
    const key = `${poll.source}-${poll.poll_id}`;
    setExpandedKey((current) => (current === key ? null : key));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Polls</h1>
        <p className="mt-1 text-sm text-muted">
          All polls from chat, food, and other sections. Create polls in their
          respective pages — this view is read-only.
        </p>
      </div>

      {polls.length === 0 ? (
        <EmptyState
          title="No polls yet"
          description="Polls created in chat, food, or other sections will appear here."
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <DataTableShell minWidth={1040}>
            <DataTable minWidth={1040}>
              <colgroup>
                <col style={{ width: 240 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 64 }} />
                <col style={{ width: 180 }} />
                <col style={{ width: 88 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 44 }} />
              </colgroup>
              <DataTableHead>
                <tr>
                  <DataTableTh>Poll</DataTableTh>
                  <DataTableTh>Source</DataTableTh>
                  <DataTableTh>Created by</DataTableTh>
                  <DataTableTh>Votes</DataTableTh>
                  <DataTableTh>Winner</DataTableTh>
                  <DataTableTh>Status</DataTableTh>
                  <DataTableTh>Date</DataTableTh>
                  <DataTableTh />
                </tr>
              </DataTableHead>
              <tbody>
                {polls.map((poll, index) => {
                  const rowKey = `${poll.source}-${poll.poll_id}`;
                  const isExpanded = expandedKey === rowKey;
                  const hasWinner = poll.winner_labels.length > 0;

                  return (
                    <Fragment key={rowKey}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`border-b border-theme ${hasWinner ? "bg-primary-soft/20" : ""}`}
                      >
                        <DataTableTd>
                          <CellText className="font-medium text-heading" title={poll.title}>
                            {poll.title}
                          </CellText>
                          {poll.subtitle && (
                            <CellText className="mt-0.5 text-xs text-muted" title={poll.subtitle}>
                              {poll.subtitle}
                            </CellText>
                          )}
                        </DataTableTd>
                        <DataTableTd>
                          <Badge>{SOURCE_LABELS[poll.source]}</Badge>
                        </DataTableTd>
                        <DataTableTd>
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar
                              name={poll.created_by.full_name}
                              color={poll.created_by.avatar_color}
                              size="sm"
                            />
                            <CellText className="text-body" title={poll.created_by.full_name}>
                              {poll.created_by.full_name}
                            </CellText>
                          </div>
                        </DataTableTd>
                        <DataTableTd className="tabular-nums text-body">
                          {poll.total_votes}
                        </DataTableTd>
                        <DataTableTd>
                          {hasWinner ? (
                            <CellText className="text-primary" title={poll.winner_labels.join(", ")}>
                              <span className="inline-flex items-center gap-1">
                                <Trophy className="h-3.5 w-3.5 shrink-0" />
                                {poll.winner_labels.join(", ")}
                              </span>
                            </CellText>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </DataTableTd>
                        <DataTableTd>
                          <Badge variant={poll.is_active ? "success" : "default"}>
                            {poll.is_active ? "Active" : "Closed"}
                          </Badge>
                        </DataTableTd>
                        <DataTableTd className="whitespace-nowrap text-muted">
                          {formatDateTime(poll.created_at)}
                        </DataTableTd>
                        <DataTableTd>
                          <button
                            type="button"
                            onClick={() => toggleRow(poll)}
                            className="rounded-md p-1 text-muted transition hover:bg-panel hover:text-primary"
                            aria-label={isExpanded ? "Collapse options" : "Expand options"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </DataTableTd>
                      </motion.tr>
                      {isExpanded && (
                        <tr className="border-b border-theme bg-panel/40">
                          <td colSpan={8} className="p-0">
                            <PollOptionsDetail poll={poll} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </DataTable>
          </DataTableShell>
        </motion.div>
      )}
    </div>
  );
}
