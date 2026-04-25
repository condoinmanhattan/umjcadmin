import type { Config } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";

export default async (req: Request) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL not set");
      return;
    }

    const sql = neon(dbUrl);

    // KST is UTC+9. This function runs at UTC 08:00 = KST 17:00
    // Get today's date in KST
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayKST = kstNow.toISOString().split("T")[0]; // YYYY-MM-DD

    // Update customers where scheduled_install_date = today and status = '서명완료'
    const result = await sql`
      UPDATE customers 
      SET status = '설치완료', updated_at = NOW()
      WHERE scheduled_install_date = ${todayKST}
        AND status = '서명완료'
      RETURNING id, customer_name
    `;

    console.log(
      `Auto status update: ${result.length} customers updated to 설치완료`
    );

    const { next_run } = await req.json();
    console.log("Next scheduled run:", next_run);
  } catch (error) {
    console.error("Auto status update error:", error);
  }
};

export const config: Config = {
  schedule: "0 8 * * *",
};
