"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { confirmPasswordReset, validatePasswordReset } from "@/lib/api";
import { applyMutationFormErrors } from "@/lib/formErrors";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [accountLabel, setAccountLabel] = useState("");
  const [validationError, setValidationError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();
  const [generalError, setGeneralError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!uid || !token) {
      setValidating(false);
      setValidationError("This reset link is incomplete.");
      return;
    }

    let cancelled = false;

    const validateLink = async () => {
      setValidating(true);
      try {
        const response = await validatePasswordReset(uid, token);
        if (cancelled) return;
        setValid(response.valid);
        setAccountLabel(response.full_name || response.email);
      } catch {
        if (!cancelled) {
          setValidationError("This reset link is invalid or has expired.");
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    };

    void validateLink();

    return () => {
      cancelled = true;
    };
  }, [uid, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setGeneralError(undefined);
    setFieldErrors({});

    const localErrors: Record<string, string> = {};
    if (password.length < 6) {
      localErrors.password = "Password must be at least 6 characters.";
    }
    if (password !== passwordConfirm) {
      localErrors.password_confirm = "Passwords do not match.";
    }
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setSubmitting(false);
      return;
    }

    try {
      const response = await confirmPasswordReset({
        uid,
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccessMessage(response.detail);
      window.setTimeout(() => router.replace("/login"), 1800);
    } catch (error) {
      applyMutationFormErrors(error, setFieldErrors, setGeneralError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Choose a new password"
      description={
        valid
          ? `Resetting password for ${accountLabel}`
          : "Secure password reset"
      }
    >
      {validating ? (
        <LoadingSpinner label="Checking reset link..." />
      ) : validationError ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[var(--danger)]">{validationError}</p>
          <Link href="/forgot-password">
            <Button className="w-full">Request a new link</Button>
          </Link>
        </div>
      ) : successMessage ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[var(--success)]">{successMessage}</p>
          <p className="text-xs text-muted">Redirecting to sign in...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-muted" htmlFor="password">
              New password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-[var(--danger)]">{fieldErrors.password}</p>
            )}
          </div>
          <div>
            <label
              className="mb-2 block text-sm text-muted"
              htmlFor="password-confirm"
            >
              Confirm password
            </label>
            <PasswordInput
              id="password-confirm"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Repeat new password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            {fieldErrors.password_confirm && (
              <p className="mt-1.5 text-xs text-[var(--danger)]">
                {fieldErrors.password_confirm}
              </p>
            )}
          </div>

          {generalError && (
            <p className="text-sm text-[var(--danger)]">{generalError}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating password..." : "Update password"}
          </Button>
        </form>
      )}

      {!successMessage && (
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/login" className="text-accent hover:text-heading">
            Back to sign in
          </Link>
        </p>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<LoadingSpinner label="Loading reset form..." />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
