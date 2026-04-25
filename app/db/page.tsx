import { Suspense } from "react";
import DbContent from "@/components/DbContent";
import { PageSkeleton } from "@/components/Skeleton";

import sql from "@/lib/db";

// Enable Incremental Static Regeneration (ISR) with a 60-second revalidation period
export const revalidate = 60;

export default async function DbPage() {
  // Fetch initial data on the server for ISR and fast initial load
  const result = await sql`SELECT * FROM db_leads ORDER BY created_at DESC LIMIT 50`;
  const mappedData = result.map((lead: any) => {
    let mappedStatus = lead.status;
    if (!mappedStatus || mappedStatus === '상담전') {
      mappedStatus = '상담대기';
    } else if (mappedStatus === '2차상담완료') {
      mappedStatus = '팔로업';
    }
    return { ...lead, status: mappedStatus };
  }) as any[];

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DbContent initialData={mappedData} />
    </Suspense>
  );
}
