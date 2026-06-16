"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calculator,
  Car,
  ChevronDown,
  ChevronUp,
  Gift,
  Plus,
  Trash2,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { Fragment, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea, FieldError, FormAlert } from "@/components/ui/Input";
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
  createExpense,
  deleteExpense,
  finalizeFoodExpense,
  getExpenses,
  getMembers,
  recordExpensePayment,
  updateExpenseCosts,
} from "@/lib/api";
import type { ExpenseEntry } from "@/types";
import type { ApiFieldErrors } from "@/lib/api";
import { applyMutationFormErrors, fieldError } from "@/lib/formErrors";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type CostType = "food" | "travel";

export default function ExpensesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFoodExpense, setEditingFoodExpense] = useState<ExpenseEntry | null>(
    null,
  );
  const [costModal, setCostModal] = useState<{
    expense: ExpenseEntry;
    type: CostType;
  } | null>(null);
  const [costValue, setCostValue] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    food_cost: "",
    travel_cost: "",
    notes: "",
    participant_ids: [] as number[],
  });
  const [foodExpenseForm, setFoodExpenseForm] = useState({
    food_cost: "",
    travel_cost: "",
    participant_ids: [] as number[],
  });
  const [createErrors, setCreateErrors] = useState<ApiFieldErrors>({});
  const [createGeneralError, setCreateGeneralError] = useState<string>();
  const [costErrors, setCostErrors] = useState<ApiFieldErrors>({});
  const [costGeneralError, setCostGeneralError] = useState<string>();
  const [finalizeErrors, setFinalizeErrors] = useState<ApiFieldErrors>({});
  const [finalizeGeneralError, setFinalizeGeneralError] = useState<string>();

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  const usersQuery = useQuery({
    queryKey: ["members-for-expense"],
    queryFn: getMembers,
  });

  const invalidateExpenses = () =>
    queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      createExpense({
        title: payload.title,
        date: payload.date,
        notes: payload.notes,
        participant_ids: payload.participant_ids,
        food_cost: payload.food_cost || "0",
        travel_cost: payload.travel_cost || "0",
      }),
    onMutate: () => {
      setCreateErrors({});
      setCreateGeneralError(undefined);
    },
    onSuccess: () => {
      invalidateExpenses();
      setShowForm(false);
      setForm({
        title: "",
        date: new Date().toISOString().slice(0, 10),
        food_cost: "",
        travel_cost: "",
        notes: "",
        participant_ids: [],
      });
    },
    onError: (error) => {
      applyMutationFormErrors(error, setCreateErrors, setCreateGeneralError);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: number;
      data: {
        food_cost: string;
        travel_cost: string;
        participant_ids: number[];
      };
    }) => finalizeFoodExpense(postId, {
      food_cost: data.food_cost || "0",
      travel_cost: data.travel_cost || "0",
      participant_ids: data.participant_ids,
    }),
    onMutate: () => {
      setFinalizeErrors({});
      setFinalizeGeneralError(undefined);
    },
    onSuccess: () => {
      invalidateExpenses();
      queryClient.invalidateQueries({ queryKey: ["treats"] });
      setEditingFoodExpense(null);
      setFoodExpenseForm({ food_cost: "", travel_cost: "", participant_ids: [] });
    },
    onError: (error) => {
      applyMutationFormErrors(error, setFinalizeErrors, setFinalizeGeneralError);
    },
  });

  const costMutation = useMutation({
    mutationFn: ({
      id,
      type,
      value,
    }: {
      id: number;
      type: CostType;
      value: string;
    }) =>
      updateExpenseCosts(id, {
        [type === "food" ? "food_cost" : "travel_cost"]: value,
      }),
    onMutate: () => {
      setCostErrors({});
      setCostGeneralError(undefined);
    },
    onSuccess: () => {
      invalidateExpenses();
      setCostModal(null);
      setCostValue("");
    },
    onError: (error) => {
      applyMutationFormErrors(error, setCostErrors, setCostGeneralError);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      expenseId,
      userId,
      amount,
    }: {
      expenseId: number;
      userId: number;
      amount: string;
    }) => recordExpensePayment(expenseId, { user_id: userId, amount }),
    onSuccess: invalidateExpenses,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: invalidateExpenses,
  });

  const toggleParticipant = (id: number, target: "manual" | "food") => {
    if (target === "manual") {
      setForm((current) => ({
        ...current,
        participant_ids: current.participant_ids.includes(id)
          ? current.participant_ids.filter((pid) => pid !== id)
          : [...current.participant_ids, id],
      }));
    } else {
      setFoodExpenseForm((current) => ({
        ...current,
        participant_ids: current.participant_ids.includes(id)
          ? current.participant_ids.filter((pid) => pid !== id)
          : [...current.participant_ids, id],
      }));
    }
  };

  const openFoodExpenseEdit = (expense: ExpenseEntry) => {
    setEditingFoodExpense(expense);
    setFoodExpenseForm({
      food_cost: expense.food_cost === "0.00" ? "" : expense.food_cost,
      travel_cost: expense.travel_cost === "0.00" ? "" : expense.travel_cost,
      participant_ids: expense.participants.map((p) => p.id),
    });
  };

  const openCostModal = (expense: ExpenseEntry, type: CostType) => {
    setCostModal({ expense, type });
    setCostValue(
      type === "food"
        ? expense.food_cost === "0.00"
          ? ""
          : expense.food_cost
        : expense.travel_cost === "0.00"
          ? ""
          : expense.travel_cost,
    );
  };

  const totalFromForm = (food: string, travel: string) =>
    (parseFloat(food || "0") || 0) + (parseFloat(travel || "0") || 0);

  if (expensesQuery.isLoading) return <LoadingSpinner />;

  const expenses = expensesQuery.data ?? [];
  const foodExpenses = expenses.filter((e) => e.is_food_expense);
  const manualExpenses = expenses.filter((e) => !e.is_food_expense);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Expense Management</h1>
          <p className="mt-1 text-sm text-muted">
            Set food and travel costs separately. Total is split evenly; track who
            paid and who still owes.
            {!isAdmin && (
              <span className="mt-1 block text-xs">
                Cost icons are visible to everyone; only admins can edit amounts.
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setCreateErrors({});
          setCreateGeneralError(undefined);
        }}
        title="New Expense Entry"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <FormAlert message={createGeneralError} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <FieldError message={fieldError(createErrors, "title")} />
            </div>
            <div>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
              <FieldError message={fieldError(createErrors, "date")} />
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Food cost in ৳ (optional)"
                value={form.food_cost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, food_cost: e.target.value }))
                }
              />
              <FieldError message={fieldError(createErrors, "food_cost")} />
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ride cost in ৳ (optional)"
                value={form.travel_cost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, travel_cost: e.target.value }))
                }
              />
              <FieldError message={fieldError(createErrors, "travel_cost")} />
            </div>
          </div>
          <div>
            <Textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <FieldError message={fieldError(createErrors, "notes")} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Select participants</p>
            <div className="flex flex-wrap gap-2">
              {usersQuery.data?.map((member) => {
                const selected = form.participant_ids.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleParticipant(member.id, "manual")}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? "border-accent/50 bg-[var(--accent-soft)] text-accent"
                        : "border-theme text-muted"
                    }`}
                  >
                    {member.full_name}
                  </button>
                );
              })}
            </div>
            <FieldError message={fieldError(createErrors, "participant_ids")} />
          </div>
          {form.participant_ids.length > 0 &&
            totalFromForm(form.food_cost, form.travel_cost) > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-accent">
                <Calculator className="h-4 w-4" />
                Total {formatCurrency(totalFromForm(form.food_cost, form.travel_cost))}{" "}
                · Share per person:{" "}
                {formatCurrency(
                  totalFromForm(form.food_cost, form.travel_cost) /
                    form.participant_ids.length,
                )}
              </div>
            )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending || form.participant_ids.length === 0
              }
            >
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={costModal !== null}
        onClose={() => {
          setCostModal(null);
          setCostValue("");
          setCostErrors({});
          setCostGeneralError(undefined);
        }}
        title={costModal?.type === "food" ? "Set food cost" : "Set ride cost"}
        description={
          costModal
            ? `${costModal.expense.title} — ${formatDate(costModal.expense.date)}`
            : undefined
        }
      >
        {costModal && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              costMutation.mutate({
                id: costModal.expense.id,
                type: costModal.type,
                value: costValue || "0",
              });
            }}
          >
            <FormAlert message={costGeneralError} />
            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={
                  costModal.type === "food"
                    ? "Food cost in ৳ (optional)"
                    : "Ride cost in ৳ (optional)"
                }
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                autoFocus
              />
              <FieldError
                message={fieldError(
                  costErrors,
                  costModal.type === "food" ? "food_cost" : "travel_cost",
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCostModal(null);
                  setCostValue("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={costMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={editingFoodExpense !== null}
        onClose={() => {
          setEditingFoodExpense(null);
          setFinalizeErrors({});
          setFinalizeGeneralError(undefined);
        }}
        title="Set expense details"
        description="Food cost, ride cost, and participants. Share is calculated from the total."
      >
        {editingFoodExpense && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingFoodExpense.food_post_id) return;
              finalizeMutation.mutate({
                postId: editingFoodExpense.food_post_id,
                data: foodExpenseForm,
              });
            }}
          >
            <FormAlert message={finalizeGeneralError} />
            <p className="rounded-xl bg-panel px-3 py-2 text-sm text-body">
              {editingFoodExpense.title}
            </p>
            {editingFoodExpense.is_treat && editingFoodExpense.treat_giver && (
              <p className="flex items-center gap-2 text-sm text-secondary">
                <Gift className="h-4 w-4" />
                Paid as treat by {editingFoodExpense.treat_giver.full_name}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Food cost in ৳ (optional)"
                  value={foodExpenseForm.food_cost}
                  onChange={(e) =>
                    setFoodExpenseForm((f) => ({
                      ...f,
                      food_cost: e.target.value,
                    }))
                  }
                />
                <FieldError message={fieldError(finalizeErrors, "food_cost")} />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ride cost in ৳ (optional)"
                  value={foodExpenseForm.travel_cost}
                  onChange={(e) =>
                    setFoodExpenseForm((f) => ({
                      ...f,
                      travel_cost: e.target.value,
                    }))
                  }
                />
                <FieldError message={fieldError(finalizeErrors, "travel_cost")} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted">Participants</p>
              <div className="flex flex-wrap gap-2">
                {usersQuery.data?.map((member) => {
                  const selected = foodExpenseForm.participant_ids.includes(
                    member.id,
                  );
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleParticipant(member.id, "food")}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        selected
                          ? "border-accent/50 bg-[var(--accent-soft)] text-accent"
                          : "border-theme text-muted"
                      }`}
                    >
                      {member.full_name}
                    </button>
                  );
                })}
              </div>
              <FieldError message={fieldError(finalizeErrors, "participant_ids")} />
            </div>
            {foodExpenseForm.participant_ids.length > 0 &&
              totalFromForm(
                foodExpenseForm.food_cost,
                foodExpenseForm.travel_cost,
              ) > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-accent">
                  <Calculator className="h-4 w-4" />
                  Total{" "}
                  {formatCurrency(
                    totalFromForm(
                      foodExpenseForm.food_cost,
                      foodExpenseForm.travel_cost,
                    ),
                  )}{" "}
                  · Share per person:{" "}
                  {formatCurrency(
                    totalFromForm(
                      foodExpenseForm.food_cost,
                      foodExpenseForm.travel_cost,
                    ) / foodExpenseForm.participant_ids.length,
                  )}
                </div>
              )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingFoodExpense(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  finalizeMutation.isPending ||
                  foodExpenseForm.participant_ids.length === 0
                }
              >
                Save details
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses recorded"
          description="Food recommendations create expense rows automatically."
        />
      ) : (
        <div className="space-y-8">
          {foodExpenses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
                  Event expenses
                </h2>
              </div>
              <ExpenseTable
                expenses={foodExpenses}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                isAdmin={isAdmin}
                onOpenCost={openCostModal}
                onEditParticipants={openFoodExpenseEdit}
                onRecordPayment={(expenseId, userId, amount) =>
                  paymentMutation.mutate({ expenseId, userId, amount })
                }
                onDelete={(id) => deleteMutation.mutate(id)}
                paymentPending={paymentMutation.isPending}
              />
            </section>
          )}

          {manualExpenses.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
                Other expenses
              </h2>
              <ExpenseTable
                expenses={manualExpenses}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                isAdmin={isAdmin}
                onOpenCost={openCostModal}
                onEditParticipants={openFoodExpenseEdit}
                onRecordPayment={(expenseId, userId, amount) =>
                  paymentMutation.mutate({ expenseId, userId, amount })
                }
                onDelete={(id) => deleteMutation.mutate(id)}
                paymentPending={paymentMutation.isPending}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function expenseStatus(expense: ExpenseEntry) {
  if (expense.is_pending) return { label: "Pending", variant: "default" as const };
  const remaining = parseFloat(expense.total_remaining);
  if (remaining > 0) return { label: "Outstanding", variant: "default" as const };
  return { label: "Settled", variant: "success" as const };
}

function ExpenseActionIcon({
  icon: Icon,
  label,
  accent = "neutral",
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  accent?: "primary" | "secondary" | "neutral";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const accentClasses = {
    primary:
      "border-primary/35 bg-primary-soft text-accent hover:border-primary/55 hover:bg-primary-soft",
    secondary:
      "border-secondary/35 bg-secondary-soft text-secondary hover:border-secondary/55",
    neutral: "border-theme bg-panel text-body hover:bg-header",
  };

  return (
    <button
      type="button"
      title={disabled ? `${label} (admin only)` : label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
        accentClasses[accent],
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}

function CostCell({ amount }: { amount: string }) {
  if (amount === "0.00") {
    return <span className="text-muted">—</span>;
  }
  const formatted = formatCurrency(amount);
  return (
    <CellText className="tabular-nums text-body" title={formatted}>
      {formatted}
    </CellText>
  );
}

function ExpenseTable({
  expenses,
  expandedId,
  setExpandedId,
  isAdmin,
  onOpenCost,
  onEditParticipants,
  onRecordPayment,
  onDelete,
  paymentPending,
}: {
  expenses: ExpenseEntry[];
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
  isAdmin: boolean;
  onOpenCost: (expense: ExpenseEntry, type: CostType) => void;
  onEditParticipants: (expense: ExpenseEntry) => void;
  onRecordPayment: (expenseId: number, userId: number, amount: string) => void;
  onDelete: (id: number) => void;
  paymentPending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <DataTableShell minWidth={1160}>
        <DataTable minWidth={1160}>
          <colgroup>
            <col style={{ width: 180 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 160 }} />
          </colgroup>
          <DataTableHead>
            <tr>
              <DataTableTh>Title</DataTableTh>
              <DataTableTh>Date</DataTableTh>
              <DataTableTh>Food</DataTableTh>
              <DataTableTh>Travel</DataTableTh>
              <DataTableTh>Total</DataTableTh>
              <DataTableTh>Members</DataTableTh>
              <DataTableTh>Share</DataTableTh>
              <DataTableTh>Paid</DataTableTh>
              <DataTableTh>Remaining</DataTableTh>
              <DataTableTh>Actions</DataTableTh>
            </tr>
          </DataTableHead>
          <tbody>
            {expenses.map((expense, index) => {
              const isExpanded = expandedId === expense.id;
              const status = expenseStatus(expense);
              return (
                <Fragment key={expense.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-theme"
                  >
                    <DataTableTd>
                      <CellText
                        className="font-medium text-heading"
                        title={expense.title}
                      >
                        {expense.title}
                      </CellText>
                      {expense.is_treat && (
                        <Badge className="mt-1">Treat</Badge>
                      )}
                    </DataTableTd>
                    <DataTableTd className="whitespace-nowrap text-muted">
                      {formatDate(expense.date)}
                    </DataTableTd>
                    <DataTableTd>
                      <CostCell amount={expense.food_cost} />
                    </DataTableTd>
                    <DataTableTd>
                      <CostCell amount={expense.travel_cost} />
                    </DataTableTd>
                    <DataTableTd className="font-medium text-accent">
                      <CellText title={expense.is_pending ? undefined : formatCurrency(expense.total_amount)}>
                        {expense.is_pending
                          ? "—"
                          : formatCurrency(expense.total_amount)}
                      </CellText>
                    </DataTableTd>
                    <DataTableTd className="tabular-nums text-body">
                      {expense.is_pending ? "—" : expense.participant_count}
                    </DataTableTd>
                    <DataTableTd className="text-[var(--success)]">
                      <CellText title={expense.is_pending ? undefined : formatCurrency(expense.per_person_share)}>
                        {expense.is_pending
                          ? "—"
                          : formatCurrency(expense.per_person_share)}
                      </CellText>
                    </DataTableTd>
                    <DataTableTd className="text-body">
                      <CellText title={expense.is_pending ? undefined : formatCurrency(expense.total_paid)}>
                        {expense.is_pending
                          ? "—"
                          : formatCurrency(expense.total_paid)}
                      </CellText>
                    </DataTableTd>
                    <DataTableTd>
                      {expense.is_pending ? (
                        "—"
                      ) : parseFloat(expense.total_remaining) > 0 ? (
                        <CellText
                          className="font-medium text-[var(--danger)]"
                          title={formatCurrency(expense.total_remaining)}
                        >
                          {formatCurrency(expense.total_remaining)}
                        </CellText>
                      ) : (
                        <span className="text-[var(--success)]">0</span>
                      )}
                    </DataTableTd>
                    <DataTableTd>
                      <div className="flex items-center gap-0.5">
                        <ExpenseActionIcon
                          icon={UtensilsCrossed}
                          label="Set food cost"
                          accent="primary"
                          disabled={!isAdmin}
                          onClick={() => onOpenCost(expense, "food")}
                        />
                        <ExpenseActionIcon
                          icon={Car}
                          label="Set ride cost"
                          accent="secondary"
                          disabled={!isAdmin}
                          onClick={() => onOpenCost(expense, "travel")}
                        />
                        {expense.is_food_expense && (
                          <ExpenseActionIcon
                            icon={Users}
                            label="Set participants"
                            accent="neutral"
                            disabled={!isAdmin}
                            onClick={() => onEditParticipants(expense)}
                          />
                        )}
                        <ExpenseActionIcon
                          icon={isExpanded ? ChevronUp : ChevronDown}
                          label={isExpanded ? "Hide breakdown" : "Show breakdown"}
                          accent="neutral"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : expense.id)
                          }
                        />
                      </div>
                    </DataTableTd>
                  </motion.tr>
                  {isExpanded && (
                    <tr className="border-b border-theme bg-panel/40">
                      <td colSpan={10} className="px-4 py-4">
                        <ExpenseBreakdown
                          expense={expense}
                          status={status}
                          isAdmin={isAdmin}
                          onRecordPayment={onRecordPayment}
                          onDelete={onDelete}
                          paymentPending={paymentPending}
                        />
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
  );
}

function ExpenseBreakdown({
  expense,
  status,
  isAdmin,
  onRecordPayment,
  onDelete,
  paymentPending,
}: {
  expense: ExpenseEntry;
  status: { label: string; variant: "default" | "success" };
  isAdmin: boolean;
  onRecordPayment: (expenseId: number, userId: number, amount: string) => void;
  onDelete: (id: number) => void;
  paymentPending: boolean;
}) {
  const [paymentInputs, setPaymentInputs] = useState<Record<number, string>>(
    {},
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={status.variant}>{status.label}</Badge>
        {expense.is_treat && expense.treat_giver && (
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <Gift className="h-3.5 w-3.5" />
            Treat by {expense.treat_giver.full_name}
          </span>
        )}
        <span className="text-xs text-muted">
          Created {formatDateTime(expense.created_at)}
        </span>
      </div>

      {expense.notes && (
        <p className="text-sm text-muted">{expense.notes}</p>
      )}

      {!expense.is_pending && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-theme bg-elevated px-3 py-2">
              <p className="text-xs text-muted">Food cost</p>
              <p className="font-medium text-heading">
                {formatCurrency(expense.food_cost)}
              </p>
            </div>
            <div className="rounded-xl border border-theme bg-elevated px-3 py-2">
              <p className="text-xs text-muted">Travel cost</p>
              <p className="font-medium text-heading">
                {formatCurrency(expense.travel_cost)}
              </p>
            </div>
            <div className="rounded-xl border border-theme bg-elevated px-3 py-2">
              <p className="text-xs text-muted">Total</p>
              <p className="font-medium text-accent">
                {formatCurrency(expense.total_amount)}
              </p>
            </div>
            <div className="rounded-xl border border-theme bg-elevated px-3 py-2">
              <p className="text-xs text-muted">Per person share</p>
              <p className="font-medium text-[var(--success)]">
                {formatCurrency(expense.per_person_share)}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-theme">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme bg-header text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 text-left font-medium">Member</th>
                  <th className="px-3 py-2 text-right font-medium">Share</th>
                  <th className="px-3 py-2 text-right font-medium">Paid</th>
                  <th className="px-3 py-2 text-right font-medium">Remaining</th>
                  {isAdmin && (
                    <th className="px-3 py-2 text-right font-medium">Record</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {expense.participant_balances.map((balance) => {
                  const remaining = parseFloat(balance.remaining_amount);
                  return (
                    <tr
                      key={balance.user.id}
                      className="border-b border-theme last:border-0"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={balance.user.full_name}
                            color={balance.user.avatar_color}
                            size="sm"
                          />
                          <span className="text-body">{balance.user.full_name}</span>
                          {balance.is_fully_paid && (
                            <Badge variant="success" className="text-[10px]">
                              Paid
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-body">
                        {formatCurrency(balance.share_amount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--success)]">
                        {formatCurrency(balance.paid_amount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {remaining > 0 ? (
                          <span className="font-medium text-[var(--danger)]">
                            {formatCurrency(balance.remaining_amount)}
                          </span>
                        ) : (
                          <span className="text-[var(--success)]">0</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 w-24 text-right text-xs"
                              placeholder="0.00"
                              value={
                                paymentInputs[balance.user.id] ??
                                balance.paid_amount
                              }
                              onChange={(e) =>
                                setPaymentInputs((prev) => ({
                                  ...prev,
                                  [balance.user.id]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={paymentPending}
                              onClick={() =>
                                onRecordPayment(
                                  expense.id,
                                  balance.user.id,
                                  paymentInputs[balance.user.id] ??
                                    balance.paid_amount,
                                )
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-header/60 text-sm font-medium">
                  <td className="px-3 py-2 text-body">Totals</td>
                  <td className="px-3 py-2 text-right tabular-nums text-body">
                    {formatCurrency(expense.total_amount)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-[var(--success)]">
                    {formatCurrency(expense.total_paid)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {parseFloat(expense.total_remaining) > 0 ? (
                      <span className="text-[var(--danger)]">
                        {formatCurrency(expense.total_remaining)}
                      </span>
                    ) : (
                      <span className="text-[var(--success)]">0</span>
                    )}
                  </td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {expense.is_pending && (
        <p className="text-sm text-muted">
          Set food and travel costs and add participants using the action icons
          above.
        </p>
      )}

      {isAdmin && (
        <div className="flex justify-end pt-1">
          <Button variant="danger" size="sm" onClick={() => onDelete(expense.id)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
