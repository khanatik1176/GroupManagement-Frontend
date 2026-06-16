"use client";

import { BarChart3, Trash2, Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import type { ChatPoll } from "@/types";
import { formatDateTime } from "@/lib/utils";

type ChatPollCardProps = {
  poll: ChatPoll;
  onVote: (pollId: number, optionId: number) => void;
  onDelete: (pollId: number) => void;
  isVoting: boolean;
};

export function ChatPollCard({
  poll,
  onVote,
  onDelete,
  isVoting,
}: ChatPollCardProps) {
  const { user, isAdmin } = useAuth();
  const canDelete = poll.created_by.id === user?.id || isAdmin;
  const hasWinner = poll.winner_option_ids.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-theme bg-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar
            name={poll.created_by.full_name}
            color={poll.created_by.avatar_color}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted">
                {poll.created_by.full_name} · {formatDateTime(poll.created_at)}
              </p>
            </div>
            <h3 className="mt-1 text-base font-semibold text-heading">{poll.title}</h3>
            <p className="mt-0.5 text-xs text-muted">
              {poll.total_votes} vote{poll.total_votes === 1 ? "" : "s"}
              {!poll.is_active && " · Closed"}
            </p>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(poll.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {poll.options.map((option) => {
          const percent =
            poll.total_votes > 0
              ? Math.round((option.vote_count / poll.total_votes) * 100)
              : 0;
          const isWinner = poll.winner_option_ids.includes(option.id);
          const isUserVote = poll.user_vote_option_id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={!poll.is_active || isVoting}
              onClick={() => onVote(poll.id, option.id)}
              className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isWinner
                  ? "border-primary bg-primary-soft ring-1 ring-primary/30"
                  : isUserVote
                    ? "border-secondary bg-secondary-soft"
                    : "item-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isWinner && hasWinner && (
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span className="text-sm font-medium text-heading">
                    {option.text}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {option.vote_count} ({percent}%)
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-panel">
                <div
                  className={`h-full rounded-full ${
                    isWinner ? "gradient-bar" : "bg-secondary/40"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
