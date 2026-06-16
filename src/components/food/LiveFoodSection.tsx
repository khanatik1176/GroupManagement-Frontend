"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useState } from "react";

import { LiveCountdown } from "@/components/food/LiveCountdown";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getElapsedProgress } from "@/lib/foodLive";
import type { FoodPoll, FoodPost } from "@/types";

type LiveFoodSectionProps = {
  livePosts: FoodPost[];
  livePolls: FoodPoll[];
  now: number;
  renderPostRsvp: (post: FoodPost) => React.ReactNode;
  renderPostComments: (postId: number) => React.ReactNode;
  onVotePoll: (pollId: number, optionId: number) => void;
  onClosePoll: (pollId: number) => void;
  isVoting: boolean;
};

function LiveProgressBar({
  createdAt,
  now,
}: {
  createdAt: string;
  now: number;
}) {
  const progress = getElapsedProgress(createdAt, now);

  return (
    <div className="h-1 overflow-hidden rounded-full bg-panel">
      <motion.div
        className="gradient-bar h-full rounded-full"
        initial={false}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.35, ease: "linear" }}
      />
    </div>
  );
}

export function LiveFoodSection({
  livePosts,
  livePolls,
  now,
  renderPostRsvp,
  renderPostComments,
  onVotePoll,
  onClosePoll,
  isVoting,
}: LiveFoodSectionProps) {
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  if (livePosts.length === 0 && livePolls.length === 0) {
    return null;
  }

  const togglePostComments = (postId: number) => {
    setExpandedPostId((current) => (current === postId ? null : postId));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-soft/80 via-elevated to-secondary-soft/60 p-4 sm:p-5"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-secondary/10 blur-3xl"
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.span>
          <div>
            <h2 className="text-lg font-semibold text-heading">Live now</h2>
            <p className="text-xs text-muted">
              New events stay live for 2 minutes, then move to the archive table.
            </p>
          </div>
        </div>
        <Badge variant="success">
          {livePosts.length + livePolls.length} active
        </Badge>
      </div>

      <div className="relative space-y-4">
        {livePosts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Live events
            </p>
            <AnimatePresence mode="popLayout">
              {livePosts.map((post, index) => {
                const isExpanded = expandedPostId === post.id;
                return (
                  <motion.article
                    key={`live-post-${post.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.94,
                      y: -12,
                      transition: { duration: 0.35 },
                    }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 320,
                      damping: 28,
                    }}
                    className="overflow-hidden rounded-2xl border border-primary/20 bg-elevated/95 shadow-lg backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-accent">
                          {post.place_name}
                        </p>
                        <h3 className="text-lg font-semibold text-heading">
                          {post.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{post.event_type}</Badge>
                          {post.is_treat && post.treat_giver && (
                            <span className="text-xs text-secondary">
                              Treat by {post.treat_giver.full_name}
                            </span>
                          )}
                        </div>
                        {post.description && (
                          <p className="text-sm text-muted">{post.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {renderPostRsvp(post)}
                          <span className="text-xs tabular-nums text-muted">
                            {post.participants.length} joining
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePostComments(post.id)}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
                              isExpanded
                                ? "bg-[var(--accent-soft)] text-accent"
                                : "text-body hover:bg-panel hover:text-accent"
                            }`}
                          >
                            <MessageSquare className="h-4 w-4" />
                            {post.comment_count} comments
                          </button>
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <Avatar
                              name={post.created_by.full_name}
                              color={post.created_by.avatar_color}
                              size="sm"
                            />
                            {post.created_by.full_name}
                          </div>
                        </div>
                      </div>
                      <LiveCountdown createdAt={post.created_at} now={now} />
                    </div>
                    <div className="px-4 pb-4">
                      <LiveProgressBar createdAt={post.created_at} now={now} />
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden border-t border-theme bg-panel/50"
                        >
                          {renderPostComments(post.id)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {livePolls.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Polls
            </p>
            <AnimatePresence mode="popLayout">
              {livePolls.map((poll, index) => (
                <motion.article
                  key={`live-poll-${poll.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.94,
                    y: -12,
                    transition: { duration: 0.35 },
                  }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 320,
                    damping: 28,
                  }}
                  className="overflow-hidden rounded-2xl border border-secondary/25 bg-elevated/95 p-4 shadow-lg backdrop-blur-sm"
                >
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-accent-2">
                        {poll.place_name}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-heading">
                        {poll.question}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Avatar
                          name={poll.created_by.full_name}
                          color={poll.created_by.avatar_color}
                          size="sm"
                        />
                        <span className="text-xs text-muted">
                          {poll.created_by.full_name}
                        </span>
                        <Badge variant={poll.is_active ? "success" : "default"}>
                          {poll.is_active ? "Active" : "Closed"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <LiveCountdown createdAt={poll.created_at} now={now} size="sm" />
                      {poll.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onClosePoll(poll.id)}
                        >
                          Close poll
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    {poll.options.map((option) => {
                      const percent =
                        poll.total_votes > 0
                          ? Math.round(
                              (option.vote_count / poll.total_votes) * 100,
                            )
                          : 0;
                      const selected = poll.user_vote_option_id === option.id;
                      const isWinner = poll.winner_option_ids.includes(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!poll.is_active || isVoting}
                          onClick={() => onVotePoll(poll.id, option.id)}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                            selected
                              ? "border-accent/50 bg-[var(--accent-soft)]"
                              : isWinner
                                ? "border-primary bg-primary-soft"
                                : "border-theme hover:border-accent/30"
                          }`}
                        >
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 text-heading">
                              {isWinner && (
                                <Trophy className="h-3.5 w-3.5 shrink-0 text-primary" />
                              )}
                              {option.text}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">
                              {option.vote_count} ({percent}%)
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-panel">
                            <motion.div
                              className={`h-full rounded-full ${
                                isWinner ? "gradient-bar" : "bg-secondary/40"
                              }`}
                              initial={false}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <LiveProgressBar createdAt={poll.created_at} now={now} />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.section>
  );
}
