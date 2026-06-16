"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cake, PartyPopper, Plus } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
import {
  createTreat,
  getBirthdayBanners,
  getMembers,
  getTreats,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ApiFieldErrors } from "@/lib/api";
import { applyMutationFormErrors, fieldError } from "@/lib/formErrors";
import type { TreatRecord } from "@/types";

export default function TreatsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    giver_id: "",
    recipient_ids: [] as number[],
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    occasion: "",
  });
  const [createErrors, setCreateErrors] = useState<ApiFieldErrors>({});
  const [createGeneralError, setCreateGeneralError] = useState<string>();

  const treatsQuery = useQuery({ queryKey: ["treats"], queryFn: getTreats });
  const birthdaysQuery = useQuery({
    queryKey: ["birthday-banners"],
    queryFn: getBirthdayBanners,
  });
  const membersQuery = useQuery({
    queryKey: ["members-for-treat"],
    queryFn: getMembers,
  });

  const createMutation = useMutation({
    mutationFn: createTreat,
    onMutate: () => {
      setCreateErrors({});
      setCreateGeneralError(undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treats"] });
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        giver_id: "",
        recipient_ids: [],
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        occasion: "",
      });
    },
    onError: (error) => {
      applyMutationFormErrors(error, setCreateErrors, setCreateGeneralError);
    },
  });

  const toggleRecipient = (id: number) => {
    setForm((current) => ({
      ...current,
      recipient_ids: current.recipient_ids.includes(id)
        ? current.recipient_ids.filter((rid) => rid !== id)
        : [...current.recipient_ids, id],
    }));
  };

  if (treatsQuery.isLoading || birthdaysQuery.isLoading) {
    return <LoadingSpinner />;
  }

  const birthdays = birthdaysQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Treat Management</h1>
          <p className="mt-1 text-sm text-muted">
            Celebrate birthdays and record treats given by members.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add Treat
        </Button>
      </div>

      {birthdays.length > 0 && (
        <div className="space-y-3">
          {birthdays.map((banner, index) => (
            <motion.div
              key={banner.user.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-3xl border border-primary bg-gradient-to-r from-[var(--primary-soft)] via-[var(--secondary-soft)] to-[var(--primary-soft)] p-6"
            >
              <div className="absolute right-4 top-4 opacity-20">
                <PartyPopper className="h-16 w-16 text-secondary" />
              </div>
              <div className="flex items-center gap-4">
                <Avatar
                  name={banner.user.full_name}
                  color={banner.user.avatar_color}
                  size="lg"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-secondary">
                    Birthday Alert
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-heading">
                    {banner.user.full_name}
                  </h2>
                  <p className="mt-1 text-sm text-body">
                    {banner.days_until === 0
                      ? "Birthday is today! Time for a treat."
                      : `${banner.days_until} day${banner.days_until === 1 ? "" : "s"} until birthday on ${formatDate(banner.birthday_date)}`}
                  </p>
                </div>
                <Cake className="ml-auto h-8 w-8 text-secondary" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setCreateErrors({});
          setCreateGeneralError(undefined);
        }}
        title="Record a Treat"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...form,
              giver_id: Number(form.giver_id),
              amount: form.amount || null,
            });
          }}
        >
          <FormAlert message={createGeneralError} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                placeholder="Treat title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <FieldError message={fieldError(createErrors, "title")} />
            </div>
            <div>
              <Input
                placeholder="Occasion (e.g. Birthday)"
                value={form.occasion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, occasion: e.target.value }))
                }
              />
              <FieldError message={fieldError(createErrors, "occasion")} />
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
                placeholder="Amount (optional)"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <FieldError message={fieldError(createErrors, "amount")} />
            </div>
          </div>
          <div>
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <FieldError message={fieldError(createErrors, "description")} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Treat giver</p>
            <select
              className="theme-input w-full rounded-xl px-4 py-2.5 text-sm"
              value={form.giver_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, giver_id: e.target.value }))
              }
              required
            >
              <option value="">Select giver</option>
              {membersQuery.data?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
            <FieldError message={fieldError(createErrors, "giver_id")} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Recipients (optional)</p>
            <div className="flex flex-wrap gap-2">
              {membersQuery.data?.map((member) => {
                const selected = form.recipient_ids.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleRecipient(member.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-theme text-muted"
                    }`}
                  >
                    {member.full_name}
                  </button>
                );
              })}
            </div>
            <FieldError message={fieldError(createErrors, "recipient_ids")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Treat</Button>
          </div>
        </form>
      </Modal>

      <Card title="Treat History" description="Food treats and manually recorded treats.">
        {(treatsQuery.data ?? []).length === 0 ? (
          <EmptyState
            title="No treats recorded"
            description="Food treats appear when a recommendation is marked as a treat."
          />
        ) : (
          <div className="space-y-6">
            {(treatsQuery.data?.filter((t) => t.is_food_treat) ?? []).length > 0 && (
              <TreatTable
                title="Food treats"
                treats={treatsQuery.data?.filter((t) => t.is_food_treat) ?? []}
              />
            )}
            {(treatsQuery.data?.filter((t) => !t.is_food_treat) ?? []).length > 0 && (
              <TreatTable
                title="Other treats"
                treats={treatsQuery.data?.filter((t) => !t.is_food_treat) ?? []}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function TreatTable({
  title,
  treats,
}: {
  title: string;
  treats: TreatRecord[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
        {title}
      </h3>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <DataTableShell minWidth={920}>
          <DataTable minWidth={920}>
            <colgroup>
              <col style={{ width: 200 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 210 }} />
            </colgroup>
            <DataTableHead>
              <tr>
                <DataTableTh>Title</DataTableTh>
                <DataTableTh>Given by</DataTableTh>
                <DataTableTh>Occasion</DataTableTh>
                <DataTableTh>Amount</DataTableTh>
                <DataTableTh>Date</DataTableTh>
                <DataTableTh>Recipients</DataTableTh>
              </tr>
            </DataTableHead>
            <tbody>
              {treats.map((treat, index) => (
                <motion.tr
                  key={treat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-theme last:border-b-0"
                >
                  <DataTableTd>
                    <CellText className="font-medium text-heading" title={treat.title}>
                      {treat.title}
                    </CellText>
                    {treat.description && (
                      <CellText className="mt-0.5 text-xs text-muted" title={treat.description}>
                        {treat.description}
                      </CellText>
                    )}
                  </DataTableTd>
                  <DataTableTd>
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar
                        name={treat.giver.full_name}
                        color={treat.giver.avatar_color}
                        size="sm"
                      />
                      <CellText className="text-body" title={treat.giver.full_name}>
                        {treat.giver.full_name}
                      </CellText>
                    </div>
                  </DataTableTd>
                  <DataTableTd>
                    <CellText className="text-body" title={treat.occasion || undefined}>
                      {treat.occasion || "—"}
                    </CellText>
                  </DataTableTd>
                  <DataTableTd className="font-medium text-accent">
                    {treat.amount ? formatCurrency(treat.amount) : "Pending"}
                  </DataTableTd>
                  <DataTableTd className="whitespace-nowrap text-muted">
                    {formatDate(treat.date)}
                  </DataTableTd>
                  <DataTableTd>
                    {treat.recipients.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <CellText className="text-body">
                        {treat.recipients.length} member
                        {treat.recipients.length === 1 ? "" : "s"}
                      </CellText>
                    )}
                  </DataTableTd>
                </motion.tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </motion.div>
    </div>
  );
}
