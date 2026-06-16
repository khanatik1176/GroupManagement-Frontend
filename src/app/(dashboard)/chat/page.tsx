"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, Check, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatPollCard } from "@/components/chat/ChatPollCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea, FieldError, FormAlert } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  createChatPoll,
  deleteChatPoll,
  deleteMessage,
  getChatFeed,
  sendMessage,
  updateMessage,
  voteChatPoll,
} from "@/lib/api";
import type { ChatFeedItem } from "@/types";
import type { ApiFieldErrors } from "@/lib/api";
import { applyMutationFormErrors, fieldError } from "@/lib/formErrors";
import { formatDateTime } from "@/lib/utils";

export default function ChatPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollErrors, setPollErrors] = useState<ApiFieldErrors>({});
  const [pollGeneralError, setPollGeneralError] = useState<string>();
  const [editErrors, setEditErrors] = useState<ApiFieldErrors>({});
  const [editGeneralError, setEditGeneralError] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const feedQuery = useQuery({
    queryKey: ["chat-feed"],
    queryFn: getChatFeed,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["chat-feed"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      updateMessage(id, content),
    onMutate: () => {
      setEditErrors({});
      setEditGeneralError(undefined);
    },
    onSuccess: () => {
      setEditingId(null);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["chat-feed"] });
    },
    onError: (error) => {
      applyMutationFormErrors(error, setEditErrors, setEditGeneralError);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-feed"] }),
  });

  const createPollMutation = useMutation({
    mutationFn: createChatPoll,
    onMutate: () => {
      setPollErrors({});
      setPollGeneralError(undefined);
    },
    onSuccess: () => {
      setShowPollForm(false);
      setPollTitle("");
      setPollOptions(["", ""]);
      queryClient.invalidateQueries({ queryKey: ["chat-feed"] });
      queryClient.invalidateQueries({ queryKey: ["poll-registry"] });
    },
    onError: (error) => {
      applyMutationFormErrors(error, setPollErrors, setPollGeneralError);
    },
  });

  const votePollMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: number; optionId: number }) =>
      voteChatPoll(pollId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-feed"] });
      queryClient.invalidateQueries({ queryKey: ["poll-registry"] });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: deleteChatPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-feed"] });
      queryClient.invalidateQueries({ queryKey: ["poll-registry"] });
    },
  });

  useEffect(() => {
    if (editingId === null) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [feedQuery.data, editingId]);

  const startEdit = (messageId: number, messageContent: string) => {
    setEditingId(messageId);
    setEditContent(messageContent);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditErrors({});
    setEditGeneralError(undefined);
  };

  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateMutation.mutate({ id: editingId, content: editContent.trim() });
  };

  const handleCreatePoll = (event: React.FormEvent) => {
    event.preventDefault();
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollTitle.trim() || options.length < 2) return;
    createPollMutation.mutate({ title: pollTitle.trim(), options });
  };

  if (feedQuery.isLoading) return <LoadingSpinner />;

  const feed: ChatFeedItem[] = feedQuery.data ?? [];

  return (
    <div className="-m-3 flex h-[calc(100vh-3.25rem)] flex-col">
      <Modal
        open={showPollForm}
        onClose={() => {
          setShowPollForm(false);
          setPollErrors({});
          setPollGeneralError(undefined);
        }}
        title="Create a poll"
      >
        <form onSubmit={handleCreatePoll} className="space-y-3">
          <FormAlert message={pollGeneralError} />
          <div>
            <Input
              placeholder="Poll question"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              required
            />
            <FieldError message={fieldError(pollErrors, "title")} />
          </div>
          {pollOptions.map((option, index) => (
            <div key={index}>
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[index] = e.target.value;
                  setPollOptions(next);
                }}
                required
              />
              <FieldError message={fieldError(pollErrors, "options", `options.${index}`)} />
            </div>
          ))}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPollOptions((opts) => [...opts, ""])}
            >
              <Plus className="h-4 w-4" />
              Add option
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPollForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPollMutation.isPending}>
              Create poll
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editingId !== null}
        onClose={cancelEdit}
        title="Edit message"
      >
        <div className="space-y-3">
          <FormAlert message={editGeneralError} />
          <div>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <FieldError message={fieldError(editErrors, "content")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              disabled={updateMutation.isPending || !editContent.trim()}
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <div className="border-b border-theme bg-header px-3 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-heading">Group Chat</h1>
            <p className="mt-1 text-sm text-muted">
              Messages and polls. All polls also appear on the Polls page.
            </p>
          </div>
          <Button onClick={() => setShowPollForm(true)} size="sm">
            <BarChart3 className="h-4 w-4" />
            New poll
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-panel">
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {feed.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Start the conversation or create a poll."
            />
          ) : (
            feed.map((item, index) => {
              if (item.type === "poll") {
                return (
                  <motion.div
                    key={`poll-${item.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex justify-center"
                  >
                    <ChatPollCard
                      poll={item}
                      onVote={(pollId, optionId) =>
                        votePollMutation.mutate({ pollId, optionId })
                      }
                      onDelete={(pollId) => deletePollMutation.mutate(pollId)}
                      isVoting={votePollMutation.isPending}
                    />
                  </motion.div>
                );
              }

              const message = item;
              const isOwn = message.sender.id === user?.id;
              const canModify = isOwn || isAdmin;

              return (
                <motion.div
                  key={`message-${message.id}`}
                  initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar
                    name={message.sender.full_name}
                    color={message.sender.avatar_color}
                    size="sm"
                  />
                  <div
                    className={`group relative max-w-[min(75%,42rem)] rounded-2xl px-4 py-3 pb-8 ${
                      isOwn
                        ? "bg-[var(--accent-soft)] text-heading"
                        : "bg-elevated text-body"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-xs font-medium text-body">
                        {message.sender.full_name}
                      </p>
                      <span className="text-[10px] text-muted">
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {canModify && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(message.id, message.content)}
                          className="cursor-pointer rounded-md p-1.5 text-muted transition hover:bg-panel hover:text-primary"
                          aria-label="Edit message"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(message.id)}
                          className="cursor-pointer rounded-md p-1.5 text-muted transition hover:bg-panel hover:text-[var(--danger)]"
                          aria-label="Delete message"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            sendMutation.mutate(content.trim());
          }}
          className="flex gap-2 border-t border-theme bg-header px-3 py-3"
        >
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={sendMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
