import { Form, Link, useLoaderData } from "react-router";
import * as notificationQueries from "~/features/notifications/queries";
import { getProfileId } from "~/features/users/utils";
import { makeSSRClient } from "~/supa-client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import { timeAgo } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { Bell, UserPlus, MessageSquare, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

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

function getNotificationMessage(notification: notificationQueries.Notification, t: any) {
    const actorUsername = notification.actor?.username ?? t('notifications.anonymous');
    const actorDisplayName = notification.actor?.full_name 
        ? `${notification.actor.full_name} (@${actorUsername})`
        : actorUsername;

    switch (notification.type) {
        case 'new_follower':
            return <p dangerouslySetInnerHTML={{ __html: t('notifications.new_follower', { actor: actorDisplayName }) }} />;
        case 'new_comment':
            return <p dangerouslySetInnerHTML={{ __html: t('notifications.new_comment', { actor: actorDisplayName }) }} />;
        case 'weekly_summary':
            return <p>{notification.message}</p>;
        case 'new_message':
            return <p dangerouslySetInnerHTML={{ __html: t('notifications.new_message', { actor: actorDisplayName, message: notification.message }) }} />;
        default:
            return <p>{t('notifications.default')}</p>;
    }
}

function getNotificationIcon(notification: notificationQueries.Notification) {
    switch (notification.type) {
        case 'new_follower':
            return <UserPlus className="h-6 w-6 text-blue-500" />;
        case 'new_comment':
            return <MessageSquare className="h-6 w-6 text-green-500" />;
        case 'weekly_summary':
            return <CalendarCheck className="h-6 w-6 text-purple-500" />;
        case 'new_message':
            return <MessageSquare className="h-6 w-6 text-pink-500" />;
        default:
            return <Bell className="h-6 w-6 text-gray-500" />;
    }
}

export default function NotificationsPage() {
  const { notifications } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 pt-16 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('notifications.title')}</h1>
        {notifications.some(n => !n.is_read) && (
            <Form method="post">
                <Button type="submit" variant="outline" size="sm">{t('notifications.mark_all_read')}</Button>
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
                    {notification.actor && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.actor?.avatar_url ?? undefined} />
                      <AvatarFallback>{notification.actor?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    )}
                    <div className="text-sm">{getNotificationMessage(notification, t)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notification.created_at)}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="mx-auto h-12 w-12 mb-4" />
            <p>{t('notifications.no_notifications')}</p>
          </div>
        )}
      </div>
    </div>
  );
} 