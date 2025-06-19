import { getConversations } from "../queries";
import { makeSSRClient } from "~/supa-client";
import { getProfileId } from "~/features/users/utils";
import type { LoaderFunctionArgs } from "react-router";
import { Link, NavLink, Outlet, useLoaderData, useOutlet } from "react-router";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { timeAgo } from "~/lib/utils";
import { useTranslation } from "react-i18next";

export async function loader({ request }: LoaderFunctionArgs) {
    const { client } = makeSSRClient(request);
    const profileId = await getProfileId(request);
    const conversations = await getConversations(client, profileId);
    return { conversations, profileId };
}

export default function MessagesLayout() {
    const { conversations, profileId } = useLoaderData<typeof loader>();
    const { t } = useTranslation();
    const outlet = useOutlet();

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 pt-24 min-h-screen">
            <h1 className="text-3xl font-bold mb-8">{t('messages.title')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 border-r pr-6">
                    <h2 className="text-xl font-semibold mb-4">{t('messages.conversations')}</h2>
                    <div className="flex flex-col gap-2">
                        {conversations.map((conv) => (
                            <NavLink
                                key={conv.id}
                                to={`/messages/${conv.id}`}
                                className={({ isActive }) => cn(
                                    "p-3 rounded-lg flex gap-4 items-start hover:bg-muted",
                                    isActive && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={conv.other_user.avatar_url ?? undefined} />
                                    <AvatarFallback>
                                        {conv.other_user.full_name?.[0] || conv.other_user.username?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold truncate">{conv.other_user.full_name || conv.other_user.username}</p>
                                        <p className="text-xs text-muted-foreground flex-shrink-0">
                                            {conv.last_message ? timeAgo(conv.last_message.created_at) : ""}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conv.last_message?.content ?? t('messages.no_messages_yet')}
                                    </p>
                                    {!conv.last_message?.is_read && conv.last_message?.sender_id !== "ME" && ( // Assuming we get current user id
                                        <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                                    )}
                                </div>
                            </NavLink>
                        ))}
                         {conversations.length === 0 && (
                            <p className="text-muted-foreground">{t('messages.no_conversations_yet')}</p>
                        )}
                    </div>
                </div>
                <div className="md:col-span-3">
                    <Outlet />
                </div>
            </div>
        </div>
    );
} 