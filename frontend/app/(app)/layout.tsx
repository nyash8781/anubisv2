"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  if (session === "loading") {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex flex-1 gap-4">
          <Skeleton className="h-full w-48 rounded-xl" />
          <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (session === null) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
