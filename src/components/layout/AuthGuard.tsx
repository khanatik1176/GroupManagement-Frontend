"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner label="Checking session..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
