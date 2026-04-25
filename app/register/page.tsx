import { Suspense } from "react";
import RegisterContent from "@/components/RegisterContent";
import { PageSkeleton } from "@/components/Skeleton";

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RegisterContent />
    </Suspense>
  );
}
