import { Suspense } from "react";
import ManageContent from "@/components/ManageContent";
import { PageSkeleton } from "@/components/Skeleton";

import sql from "@/lib/db";

// Enable Incremental Static Regeneration (ISR) with a 60-second revalidation period
export const revalidate = 60;

export default async function ManagePage() {
  // Fetch initial data on the server for ISR and fast initial load
  const result = await sql`SELECT * FROM customers ORDER BY received_at DESC NULLS LAST, created_at DESC LIMIT 50`;
  const initialData = Array.isArray(result) ? result as any[] : [];

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ManageContent initialData={initialData} />
    </Suspense>
  );
}
