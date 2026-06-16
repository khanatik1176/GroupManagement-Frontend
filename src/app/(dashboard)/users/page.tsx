"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select, FieldError, FormAlert } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  createUser,
  deleteUser,
  getUsers,
  toggleUserStatus,
  updateUser,
  type ApiFieldErrors,
} from "@/lib/api";
import { applyMutationFormErrors, fieldError } from "@/lib/formErrors";
import type { User, UserRole } from "@/types";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role: "temporary" as UserRole,
  phone: "",
  birthday: "",
  avatar_color: "#6366f1",
  is_active: true,
};

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<ApiFieldErrors>({});
  const [generalError, setGeneralError] = useState<string>();

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onMutate: () => {
      setFormErrors({});
      setGeneralError(undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (error) => {
      applyMutationFormErrors(error, setFormErrors, setGeneralError);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateUser(id, data),
    onMutate: () => {
      setFormErrors({});
      setGeneralError(undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      setEditingUser(null);
      setForm(emptyForm);
    },
    onError: (error) => {
      applyMutationFormErrors(error, setFormErrors, setGeneralError);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  if (!isAdmin) return null;
  if (usersQuery.isLoading) return <LoadingSpinner />;

  const startEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      birthday: user.birthday ?? "",
      avatar_color: user.avatar_color,
      is_active: user.is_active,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading">User Management</h1>
          <p className="mt-1 text-sm text-muted">
            Admin-only panel to add, edit, disable, or remove members.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
          setForm(emptyForm);
          setFormErrors({});
          setGeneralError(undefined);
        }}
        title={editingUser ? "Edit User" : "Create User"}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (editingUser) {
              updateMutation.mutate({
                id: editingUser.id,
                data: {
                  email: form.email,
                  first_name: form.first_name,
                  last_name: form.last_name,
                  role: form.role,
                  phone: form.phone,
                  birthday: form.birthday || null,
                  avatar_color: form.avatar_color,
                  is_active: form.is_active,
                },
              });
            } else {
              createMutation.mutate(form);
            }
          }}
        >
          <FormAlert message={generalError} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                disabled={!!editingUser}
                required={!editingUser}
              />
              <FieldError message={fieldError(formErrors, "username")} />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <FieldError message={fieldError(formErrors, "email")} />
            </div>
            {!editingUser && (
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
                <FieldError message={fieldError(formErrors, "password")} />
              </div>
            )}
            <div>
              <Select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
              >
                <option value="admin">Admin</option>
                <option value="permanent">Permanent Member</option>
                <option value="temporary">Temporary Member</option>
              </Select>
              <FieldError message={fieldError(formErrors, "role")} />
            </div>
            <div>
              <Input
                placeholder="First name"
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
              />
              <FieldError message={fieldError(formErrors, "first_name")} />
            </div>
            <div>
              <Input
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
              <FieldError message={fieldError(formErrors, "last_name")} />
            </div>
            <div>
              <Input
                type="date"
                value={form.birthday}
                onChange={(e) =>
                  setForm((f) => ({ ...f, birthday: e.target.value }))
                }
              />
              <FieldError message={fieldError(formErrors, "birthday")} />
            </div>
            <div>
              <Input
                type="color"
                value={form.avatar_color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avatar_color: e.target.value }))
                }
              />
              <FieldError message={fieldError(formErrors, "avatar_color")} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingUser(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      <Card title="All Users">
        {(usersQuery.data ?? []).length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="space-y-3">
            {usersQuery.data?.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="item-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.full_name} color={user.avatar_color} />
                  <div>
                    <p className="font-medium text-heading">{user.full_name}</p>
                    <p className="text-sm text-muted">@{user.username}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <RoleBadge role={user.role} />
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          user.is_active
                            ? "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]"
                            : "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
                        }`}
                      >
                        {user.is_active ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(user)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleMutation.mutate(user.id)}
                  >
                    <Power className="h-4 w-4" />
                    {user.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteMutation.mutate(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
