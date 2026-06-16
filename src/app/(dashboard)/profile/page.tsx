"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    bio: user?.bio ?? "",
    birthday: user?.birthday ?? "",
    avatar_color: user?.avatar_color ?? "#6366f1",
  });
  const [message, setMessage] = useState("");

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refreshUser();
      setMessage("Profile updated successfully.");
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card title="Your Profile" description="Manage your personal information.">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.full_name} color={user.avatar_color} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-heading">{user.full_name}</h2>
            <p className="text-sm text-muted">@{user.username}</p>
            <div className="mt-2">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage("");
            updateMutation.mutate({
              ...form,
              birthday: form.birthday || null,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="First name"
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
            />
            <Input
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              type="date"
              value={form.birthday}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthday: e.target.value }))
              }
            />
            <Input
              type="color"
              value={form.avatar_color}
              onChange={(e) =>
                setForm((f) => ({ ...f, avatar_color: e.target.value }))
              }
            />
          </div>
          <Textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
          {message && <p className="text-sm text-[var(--success)]">{message}</p>}
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        <div className="mt-6 grid gap-3 rounded-2xl border border-theme bg-panel p-4 text-sm text-muted md:grid-cols-2">
          <p>Joined: {formatDate(user.date_joined)}</p>
          <p>Status: {user.is_active ? "Active" : "Disabled"}</p>
        </div>
      </Card>
    </div>
  );
}
