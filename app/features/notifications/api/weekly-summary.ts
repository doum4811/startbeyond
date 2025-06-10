import type { ActionFunctionArgs } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";

// IMPORTANT: These values must be configured in your hosting environment's secrets.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

interface NotificationInsert {
  recipient_id: string;
  type: "weekly_summary";
  message: string;
  resource_url?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase environment variables");
    return new Response(JSON.stringify({ error: "Internal Server Error: Missing configuration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("profile_id");

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No users to notify." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const today = DateTime.now().startOf("day");
    const lastMonday = today.startOf("week").minus({ weeks: 1 }).toISODate();
    const lastSunday = today.startOf("week").minus({ days: 1 }).toISODate();

    const notificationsToInsert: NotificationInsert[] = [];

    for (const profile of profiles) {
      const { data: dailyRecords, error: recordsError } = await supabaseAdmin
        .from("daily_records")
        .select("date")
        .eq("profile_id", profile.profile_id)
        .gte("date", lastMonday)
        .lte("date", lastSunday);

      if (recordsError) {
        console.error(`Could not fetch records for user ${profile.profile_id}:`, recordsError.message);
        continue;
      }

      const distinctDays = new Set((dailyRecords as any[]).map(r => r.date)).size;

      let message = "";
      if (distinctDays > 0) {
        message = `지난 주(${lastMonday} ~ ${lastSunday})에 ${distinctDays}일의 하루 기록을 작성하셨네요! 이번 주도 화이팅하세요!`;
      } else {
        message = `지난 주(${lastMonday} ~ ${lastSunday})에는 기록이 없으셨네요. 이번 주부터 다시 시작해보는 건 어떨까요?`;
      }

      notificationsToInsert.push({
        recipient_id: profile.profile_id,
        type: "weekly_summary",
        message: message,
        resource_url: "/daily",
      });
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notificationsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert notifications: ${insertError.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Generated ${notificationsToInsert.length} notifications.` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const error = e as Error;
    console.error("Cron job failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 