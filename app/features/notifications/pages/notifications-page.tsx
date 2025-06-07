import { Form, Link, useLoaderData } from "react-router";
import * as notificationQueries from "~/features/notifications/queries";
import { getProfileId } from "~/features/users/utils";
import { makeSSRClient } from "~/supa-client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import { timeAgo } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { Bell, UserPlus, MessageSquare } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { client } = makeSSRClient(request);
  const userId = await getProfileId(request);
  const notifications = await notificationQueries.getNotifications(client, { userId });
  return { notifications };
}

export async function action({ request }: ActionFunctionArgs) {
    const { client } = makeSSRClient(request);
    const userId = await getProfileId(request);
    await notificationQueries.markAllNotificationsAsRead(client, { userId });
    return { ok: true };
}

function getNotificationMessage(notification: notificationQueries.Notification) {
    const actorUsername = notification.actor?.username ?? 'Someone';
    switch (notification.type) {
        case 'new_follower':
            return <p><span className="font-semibold">{actorUsername}</span> started following you.</p>;
        case 'new_comment':
            return <p><span className="font-semibold">{actorUsername}</span> commented on your post.</p>;
        default:
            return <p>You have a new notification.</p>;
    }
}

function getNotificationIcon(notification: notificationQueries.Notification) {
    switch (notification.type) {
        case 'new_follower':
            return <UserPlus className="h-6 w-6 text-blue-500" />;
        case 'new_comment':
            return <MessageSquare className="h-6 w-6 text-green-500" />;
        default:
            return <Bell className="h-6 w-6 text-gray-500" />;
    }
}

export default function NotificationsPage() {
  const { notifications } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 pt-24 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some(n => !n.is_read) && (
            <Form method="post">
                <Button type="submit" variant="outline" size="sm">Mark all as read</Button>
            </Form>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Link 
              key={notification.id}
              to={notification.resource_url || '#'}
              className={cn(
                "block p-4 rounded-lg border transition-colors",
                notification.is_read 
                  ? "bg-transparent text-muted-foreground hover:bg-muted/50" 
                  : "bg-primary/5 border-primary/20 text-foreground hover:bg-primary/10"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-8 pt-1">{getNotificationIcon(notification)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.actor?.avatar_url ?? undefined} />
                      <AvatarFallback>{notification.actor?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">{getNotificationMessage(notification)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notification.created_at)}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="mx-auto h-12 w-12 mb-4" />
            <p>You have no notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
} 