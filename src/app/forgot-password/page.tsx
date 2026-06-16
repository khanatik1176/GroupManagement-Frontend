"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { requestPasswordReset } from "@/lib/api";
import { applyMutationFormErrors } from "@/lib/formErrors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();
  const [generalError, setGeneralError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage(undefined);
    setGeneralError(undefined);
    setFieldErrors({});

    try {
      const response = await requestPasswordReset(email.trim());
      setSuccessMessage(response.detail);
      setEmail("");
    } catch (error) {
      applyMutationFormErrors(error, setFieldErrors, setGeneralError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card
          title="Forgot password"
          description="Enter the email on your account. We'll send a reset link if it exists."
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-[var(--danger)]">{fieldErrors.email}</p>
              )}
            </div>

            {successMessage && (
              <p className="rounded-xl border border-[var(--success)]/25 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
                {successMessage}
              </p>
            )}
            {generalError && (
              <p className="text-sm text-[var(--danger)]">{generalError}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            Remember your password?{" "}
            <Link href="/login" className="text-accent hover:text-heading">
              Back to sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-muted">
            Free email mode: with the default dev setup, the reset link appears in
            your Django server terminal instead of a real inbox.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
