"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Fragment, useState } from "react";

import { LiveFoodSection } from "@/components/food/LiveFoodSection";
import { useLiveClock } from "@/components/food/LiveCountdown";
import type { PlaceSelection } from "@/components/maps/PlaceMapPicker";
import { PlaceMapViewModal } from "@/components/maps/PlaceMapViewModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea, Select, FieldError, FormAlert } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import {
  CellText,
  DataTable,
  DataTableHead,
  DataTableShell,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
import { useAuth } from "@/context/AuthContext";
import {
  createFoodPost,
  createFoodPostComment,
  deleteFoodPostComment,
  getFoodPostComments,
  getFoodPosts,
  getMembers,
  rsvpEventPost,
} from "@/lib/api";
import { partitionByLive } from "@/lib/foodLive";
import type { EventType, FoodPost, FoodPostComment, RSVPStatus } from "@/types";
import type { ApiFieldErrors } from "@/lib/api";
import { applyMutationFormErrors, fieldError } from "@/lib/formErrors";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

const PlaceMapPicker = dynamic(
  () =>
    import("@/components/maps/PlaceMapPicker").then((module) => module.PlaceMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-theme bg-panel text-sm text-muted">
        Loading map...
      </div>
    ),
  },
);

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  food: "Food",
  tour: "Tour",
  treat: "Treat",
};

const emptyEventForm: PlaceSelection & {
  title: string;
  description: string;
  event_type: EventType;
  treat_giver_id: string;
} = {
  title: "",
  description: "",
  place_name: "",
  place_latitude: null,
  place_longitude: null,
  event_type: "food",
  treat_giver_id: "",
};

function updatePostInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedPost: FoodPost,
) {
  queryClient.setQueryData<FoodPost[]>(["event-posts"], (current) =>
    current?.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
  );
}

function EventTypeBadge({ type }: { type: EventType }) {
  const variant =
    type === "treat" ? "success" : type === "tour" ? "default" : "default";
  return <Badge variant={variant}>{EVENT_TYPE_LABELS[type]}</Badge>;
}

function RSVPButtons({ post }: { post: FoodPost }) {
  const queryClient = useQueryClient();

  const rsvpMutation = useMutation({
    mutationFn: (status: RSVPStatus) => rsvpEventPost(post.id, status),
    onSuccess: (updatedPost) => {
      updatePostInCache(queryClient, updatedPost);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["treats"] });
    },
  });

  return (
    <div
      className="inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="I'm joining"
        disabled={rsvpMutation.isPending}
        onClick={() => rsvpMutation.mutate("join")}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
          post.user_rsvp === "join"
            ? "border-[var(--success)]/40 bg-[var(--success)]/15 text-[var(--success)]"
            : "border-theme bg-panel text-muted hover:border-[var(--success)]/30 hover:text-[var(--success)]",
        )}
        aria-label="Join event"
      >
        <UserCheck className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        title="Not joining"
        disabled={rsvpMutation.isPending}
        onClick={() => rsvpMutation.mutate("not_join")}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
          post.user_rsvp === "not_join"
            ? "border-[var(--danger)]/40 bg-[var(--danger)]/15 text-[var(--danger)]"
            : "border-theme bg-panel text-muted hover:border-[var(--danger)]/30 hover:text-[var(--danger)]",
        )}
        aria-label="Decline event"
      >
        <UserX className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

function PostCommentsPanel({ postId }: { postId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["event-post-comments", postId],
    queryFn: () => getFoodPostComments(postId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => createFoodPostComment(postId, content),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["event-post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["event-posts"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteFoodPostComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["event-posts"] });
    },
  });

  if (commentsQuery.isLoading) {
    return (
      <div className="px-4 py-3">
        <LoadingSpinner label="Loading comments..." />
      </div>
    );
  }

  const comments = commentsQuery.data ?? [];

  return (
    <div className="space-y-4 px-4 py-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          addCommentMutation.mutate(comment.trim());
        }}
      >
        <Input
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={addCommentMutation.isPending}>
          Post
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-muted">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((item: FoodPostComment) => {
            const canDelete =
              user?.id === item.author.id || user?.role === "admin";
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-theme bg-panel p-3"
              >
                <Avatar
                  name={item.author.full_name}
                  color={item.author.avatar_color}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-heading">
                      {item.author.full_name}
                    </p>
                    <span className="text-xs text-muted">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-body">{item.content}</p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteCommentMutation.mutate(item.id)}
                    className="rounded-md p-1.5 text-muted transition hover:text-[var(--danger)]"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ParticipantsCell({ post }: { post: FoodPost }) {
  if (post.participants.length === 0) {
    return <span className="text-muted">—</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="flex shrink-0 -space-x-2">
        {post.participants.slice(0, 3).map((member) => (
          <span
            key={member.id}
            className="inline-block rounded-full ring-2 ring-elevated"
          >
            <Avatar
              name={member.full_name}
              color={member.avatar_color}
              size="sm"
            />
          </span>
        ))}
      </div>
      <CellText className="tabular-nums text-xs text-body" title={`${post.participants.length} joining · ${post.join_count} yes · ${post.not_join_count} no`}>
        {post.participants.length}
      </CellText>
    </div>
  );
}

function EventsTable({ events }: { events: FoodPost[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mapEvent, setMapEvent] = useState<FoodPost | null>(null);

  if (events.length === 0) {
    return (
      <EmptyState
        title="No archived events"
        description="Live events appear above for 2 minutes, then move here."
      />
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <DataTableShell minWidth={1280}>
        <DataTable minWidth={1280}>
          <colgroup>
            <col style={{ width: 72 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 44 }} />
          </colgroup>
          <DataTableHead>
            <tr>
              <DataTableTh>Type</DataTableTh>
              <DataTableTh>Place</DataTableTh>
              <DataTableTh>Title</DataTableTh>
              <DataTableTh>Description</DataTableTh>
              <DataTableTh>Participants</DataTableTh>
              <DataTableTh>Comments</DataTableTh>
              <DataTableTh>Created by</DataTableTh>
              <DataTableTh>Total</DataTableTh>
              <DataTableTh>Paid</DataTableTh>
              <DataTableTh>Remaining</DataTableTh>
              <DataTableTh>Response</DataTableTh>
              <DataTableTh />
            </tr>
          </DataTableHead>
          <tbody>
            {events.map((event, index) => {
              const isExpanded = expandedId === event.id;
              const total = parseFloat(event.total_expense);
              const remaining = parseFloat(event.total_remaining);

              return (
                <Fragment key={event.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-theme"
                  >
                    <DataTableTd>
                      <EventTypeBadge type={event.event_type} />
                    </DataTableTd>
                    <DataTableTd>
                      <button
                        type="button"
                        onClick={() => setMapEvent(event)}
                        className="inline-flex max-w-full items-center gap-1.5 text-left transition hover:text-heading"
                        title="View on map"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <CellText className="font-medium text-accent underline-offset-2 hover:underline">
                          {event.place_name}
                        </CellText>
                      </button>
                    </DataTableTd>
                    <DataTableTd>
                      <CellText className="font-medium text-heading" title={event.title}>
                        {event.title}
                      </CellText>
                      {event.is_treat && event.treat_giver && (
                        <CellText className="mt-0.5 text-xs text-secondary" title={event.treat_giver.full_name}>
                          by {event.treat_giver.full_name}
                        </CellText>
                      )}
                    </DataTableTd>
                    <DataTableTd>
                      <CellText className="text-body" title={event.description || undefined}>
                        {event.description || "—"}
                      </CellText>
                    </DataTableTd>
                    <DataTableTd>
                      <ParticipantsCell post={event} />
                    </DataTableTd>
                    <DataTableTd>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : event.id)
                        }
                        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-body transition hover:bg-panel hover:text-accent"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="tabular-nums">{event.comment_count}</span>
                      </button>
                    </DataTableTd>
                    <DataTableTd>
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          name={event.created_by.full_name}
                          color={event.created_by.avatar_color}
                          size="sm"
                        />
                        <CellText className="text-body" title={event.created_by.full_name}>
                          {event.created_by.full_name}
                        </CellText>
                      </div>
                    </DataTableTd>
                    <DataTableTd className="font-medium text-accent">
                      <CellText title={total > 0 ? formatCurrency(event.total_expense) : undefined}>
                        {total > 0 ? formatCurrency(event.total_expense) : "—"}
                      </CellText>
                    </DataTableTd>
                    <DataTableTd className="text-body">
                      <CellText title={total > 0 ? formatCurrency(event.total_paid) : undefined}>
                        {total > 0 ? formatCurrency(event.total_paid) : "—"}
                      </CellText>
                    </DataTableTd>
                    <DataTableTd>
                      {total <= 0 ? (
                        "—"
                      ) : remaining > 0 ? (
                        <CellText className="font-medium text-[var(--danger)]" title={formatCurrency(event.total_remaining)}>
                          {formatCurrency(event.total_remaining)}
                        </CellText>
                      ) : (
                        <span className="text-[var(--success)]">0</span>
                      )}
                    </DataTableTd>
                    <DataTableTd>
                      <RSVPButtons post={event} />
                    </DataTableTd>
                    <DataTableTd>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : event.id)
                        }
                        className="rounded-md p-1 text-muted transition hover:bg-panel hover:text-primary"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
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
                      <td colSpan={12} className="p-0">
                        <div className="border-b border-theme px-4 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted">
                            Comments
                          </p>
                        </div>
                        <PostCommentsPanel postId={event.id} />
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

      <PlaceMapViewModal
        open={mapEvent !== null}
        onClose={() => setMapEvent(null)}
        placeName={mapEvent?.place_name ?? ""}
        placeLatitude={mapEvent?.place_latitude ?? null}
        placeLongitude={mapEvent?.place_longitude ?? null}
      />
    </>
  );
}

export default function EventsPage() {
  const queryClient = useQueryClient();
  const now = useLiveClock();
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [createErrors, setCreateErrors] = useState<ApiFieldErrors>({});
  const [createGeneralError, setCreateGeneralError] = useState<string>();

  const openEventForm = () => {
    setEventForm(emptyEventForm);
    setCreateErrors({});
    setCreateGeneralError(undefined);
    setShowEventForm(true);
  };

  const closeEventForm = () => {
    setShowEventForm(false);
    setCreateErrors({});
    setCreateGeneralError(undefined);
  };

  const submitEventForm = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrors({});
    setCreateGeneralError(undefined);

    const localErrors: ApiFieldErrors = {};
    if (!eventForm.title.trim()) {
      localErrors.title = "Title is required.";
    }
    if (!eventForm.place_name.trim()) {
      localErrors.place_name = "Place is required.";
    }
    if (eventForm.event_type === "treat" && !eventForm.treat_giver_id) {
      localErrors.treat_giver_id = "Select who gave the treat.";
    }
    if (Object.keys(localErrors).length > 0) {
      setCreateErrors(localErrors);
      return;
    }

    createEventMutation.mutate({
      title: eventForm.title.trim(),
      description: eventForm.description.trim(),
      place_name: eventForm.place_name.trim(),
      place_latitude: eventForm.place_latitude,
      place_longitude: eventForm.place_longitude,
      event_type: eventForm.event_type,
      treat_giver_id:
        eventForm.event_type === "treat"
          ? Number(eventForm.treat_giver_id)
          : null,
    });
  };

  const eventsQuery = useQuery({
    queryKey: ["event-posts"],
    queryFn: getFoodPosts,
  });

  const membersQuery = useQuery({
    queryKey: ["members-for-event"],
    queryFn: getMembers,
  });

  const createEventMutation = useMutation({
    mutationFn: createFoodPost,
    onMutate: () => {
      setCreateErrors({});
      setCreateGeneralError(undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-posts"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["treats"] });
      setEventForm(emptyEventForm);
      setShowEventForm(false);
    },
    onError: (error) => {
      applyMutationFormErrors(error, setCreateErrors, setCreateGeneralError);
    },
  });

  if (eventsQuery.isLoading) return <LoadingSpinner />;

  if (eventsQuery.isError) {
    return (
      <EmptyState
        title="Could not load events"
        description={eventsQuery.error.message}
      />
    );
  }

  const events = eventsQuery.data ?? [];
  const { live: liveEvents, archived: archivedEvents } = partitionByLive(
    events,
    now,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Events</h1>
          <p className="mt-1 text-sm text-muted">
            Create food, tour, or treat events. Members RSVP to join — participants
            sync to expenses automatically while live (2 min window for testing).
          </p>
        </div>
        <Button onClick={openEventForm}>
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      <LiveFoodSection
        livePosts={liveEvents}
        livePolls={[]}
        now={now}
        renderPostRsvp={(post) => <RSVPButtons post={post} />}
        renderPostComments={(postId) => <PostCommentsPanel postId={postId} />}
        onVotePoll={() => {}}
        onClosePoll={() => {}}
        isVoting={false}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          All events ({archivedEvents.length + liveEvents.length})
        </h2>
        <EventsTable events={events} />
      </section>

      <Modal
        open={showEventForm}
        onClose={closeEventForm}
        title="New Event"
        description="Plan a food outing, tour, or treat for the group."
        className="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={submitEventForm} noValidate>
          <FormAlert message={createGeneralError} />

          <div>
            <label className="mb-2 block text-sm text-muted" htmlFor="event-type">
              Event type
            </label>
            <Select
              id="event-type"
              value={eventForm.event_type}
              onChange={(e) =>
                setEventForm((f) => ({
                  ...f,
                  event_type: e.target.value as EventType,
                  treat_giver_id:
                    e.target.value === "treat" ? f.treat_giver_id : "",
                }))
              }
            >
              <option value="food">Food</option>
              <option value="tour">Tour</option>
              <option value="treat">Treat</option>
            </Select>
            <FieldError message={fieldError(createErrors, "event_type")} />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted" htmlFor="event-place">
              Place
            </label>
            <Input
              id="event-place"
              placeholder="e.g. Alfresco, Downtown"
              value={eventForm.place_name}
              onChange={(e) =>
                setEventForm((f) => ({ ...f, place_name: e.target.value }))
              }
            />
            <FieldError message={fieldError(createErrors, "place_name")} />
            <div className="mt-3">
              <PlaceMapPicker
                value={{
                  place_name: eventForm.place_name,
                  place_latitude: eventForm.place_latitude,
                  place_longitude: eventForm.place_longitude,
                }}
                onChange={(selection) =>
                  setEventForm((current) => ({
                    ...current,
                    place_name: selection.place_name || current.place_name,
                    place_latitude: selection.place_latitude,
                    place_longitude: selection.place_longitude,
                  }))
                }
              />
            </div>
            <FieldError message={fieldError(createErrors, "place_latitude")} />
            <FieldError message={fieldError(createErrors, "place_longitude")} />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted" htmlFor="event-title">
              Title
            </label>
            <Input
              id="event-title"
              placeholder="e.g. Team lunch"
              value={eventForm.title}
              onChange={(e) =>
                setEventForm((f) => ({ ...f, title: e.target.value }))
              }
            />
            <FieldError message={fieldError(createErrors, "title")} />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted" htmlFor="event-description">
              Description
            </label>
            <Textarea
              id="event-description"
              placeholder="Optional details about the event"
              value={eventForm.description}
              onChange={(e) =>
                setEventForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
            <FieldError message={fieldError(createErrors, "description")} />
          </div>

          {eventForm.event_type === "treat" && (
            <div>
              <label className="mb-2 block text-sm text-muted" htmlFor="treat-giver">
                Treat given by
              </label>
              {membersQuery.isLoading ? (
                <p className="text-sm text-muted">Loading members...</p>
              ) : membersQuery.isError ? (
                <p className="text-sm text-[var(--danger)]">
                  Could not load members. Close and try again.
                </p>
              ) : (
                <Select
                  id="treat-giver"
                  value={eventForm.treat_giver_id}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, treat_giver_id: e.target.value }))
                  }
                >
                  <option value="">Select member</option>
                  {membersQuery.data?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </Select>
              )}
              <FieldError message={fieldError(createErrors, "treat_giver_id")} />
              <p className="mt-2 text-xs text-muted">
                When the expense is set, the treat giver is marked as having paid
                the full amount.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-theme pt-4">
            <Button type="button" variant="ghost" onClick={closeEventForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
