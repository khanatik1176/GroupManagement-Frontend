"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Cake,
  CalendarDays,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/Card";
import { TakaIcon } from "@/components/ui/TakaIcon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import {
  getBirthdayBanners,
  getChatPolls,
  getExpenses,
  getFoodPolls,
  getMessages,
  getTreats,
} from "@/lib/api";

const quickLinks = [
  { href: "/chat", label: "Open Chat", icon: MessageSquare },
  { href: "/polls", label: "Polls", icon: BarChart3 },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/expenses", label: "Expenses", icon: TakaIcon },
  { href: "/treats", label: "Treat Panel", icon: Cake },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [messages, polls, pollsFood, expenses, treats, birthdays] = await Promise.all([
        getMessages(),
        getChatPolls(),
        getFoodPolls(),
        getExpenses(),
        getTreats(),
        getBirthdayBanners(),
      ]);
      return {
        messages: messages.length,
        polls: polls.length,
        foodPolls: pollsFood.filter((poll) => poll.is_active).length,
        expenses: expenses.length,
        treats: treats.length,
        birthdays: birthdays.length,
      };
    },
  });

  if (statsQuery.isLoading) {
    return <LoadingSpinner />;
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="neon-border rounded-3xl p-[1px]"
      >
        <div className="rounded-3xl bg-elevated p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-accent" />
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">
                Mission Control
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-heading md:text-4xl">
                Hello, {user?.first_name || user?.username}
              </h1>
              <p className="mt-3 text-muted">
                Manage your group chat, events, shared expenses, and treat
                celebrations from one futuristic workspace.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Messages", value: stats?.messages ?? 0 },
          { label: "Chat Polls", value: stats?.polls ?? 0 },
          { label: "Active Food Polls", value: stats?.foodPolls ?? 0 },
          { label: "Expense Records", value: stats?.expenses ?? 0 },
          { label: "Upcoming Birthdays", value: stats?.birthdays ?? 0 },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <p className="text-3xl font-semibold text-accent">{item.value}</p>
              <p className="mt-2 text-sm text-muted">{item.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card title="Quick Actions" description="Jump into the modules you need.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="item-card rounded-2xl px-4 py-5 transition hover:border-accent/40 hover:bg-[var(--accent-soft)]"
              >
                <Icon className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm font-medium text-heading">
                  {link.label}
                </p>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
