import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export type Notification =
  Database["public"]["Tables"]["notifications"]["Row"] & {
    actor: {
      username: string | null;
      avatar_url: string | null;
      full_name: string | null;
    } | null;
  };

export async function getNotifications(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
): Promise<Notification[]> {
  const { data, error } = await client
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!actor_id (
        username,
        avatar_url,
        full_name
      )
    `
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw new Error(error.message);
  }

  return data as Notification[];
}

export async function getUnreadNotificationCount(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
): Promise<number> {
  const { count, error } = await client
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(
  client: SupabaseClient<Database>,
  { notificationId, userId }: { notificationId: string; userId: string }
) {
  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_id", userId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error(error.message);
  }
}

export async function markAllNotificationsAsRead(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error(error.message);
  }
} 