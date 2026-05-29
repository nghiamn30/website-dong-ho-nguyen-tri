import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { PageSkeleton } from "@/components/pages/page-skeleton";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<PageSkeleton />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
