import { getConversations } from "../queries";
import { makeSSRClient } from "~/supa-client";
import { getRequiredProfileId } from "~/features/users/utils";
import type { LoaderFunctionArgs } from "react-router";
import { NavLink, Outlet, redirect } from "react-router";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { timeAgo } from "~/lib/utils";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/messages-layout";

export const meta: Route.MetaFunction = () => {
    return [{ title: 'Messages | startbeyond' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
    const { client, headers } = makeSSRClient(request);
    try {
        const profileId = await getRequiredProfileId(request);
        const conversations = await getConversations(client, profileId);
        return { conversations, profileId };
    } catch (error: any) {
        if (error instanceof Response) {
            return error; // re-throw the response error from getRequiredProfileId
        }
        // For any other errors, redirect to login
        return redirect("/auth/login", { headers });
    }
}

export default function MessagesLayout({ loaderData }: Route.ComponentProps) {
    if (loaderData instanceof Response) {
        return null; // Should be handled by router's errorElement
    }
    const { conversations } = loaderData;
    const { t } = useTranslation();

    return (
        <div className="h-screen-minus-nav grid md:grid-cols-[320px_1fr] antialiased">
            <aside className="flex flex-col border-r bg-background">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold tracking-tight">{t('messages.title')}</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="p-2 space-y-1">
                        {conversations.map((conv: any) => {
                             const otherParticipant = conv.other_user;
                             return (
                                <NavLink
                                    key={conv.id}
                                    to={`/messages/${conv.id}`}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                        isActive && "bg-muted text-primary"
                                    )}
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={otherParticipant.avatar_url ?? undefined} alt={otherParticipant.full_name} />
                                        <AvatarFallback>{otherParticipant.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{otherParticipant.full_name}</p>
                                        <p className="text-sm truncate">{conv.last_message?.content ?? t('messages.no_messages_yet')}</p>
                                    </div>
                                     <span className="text-xs text-muted-foreground">
                                        {conv.last_message ? timeAgo(conv.last_message.created_at) : ""}
                                    </span>
                                </NavLink>
                             )
                        })}
                         {conversations.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {t('messages.no_conversations_yet')}
                            </div>
                        )}
                    </nav>
                </div>
            </aside>
            <main className="flex flex-col h-full">
                <Outlet />
            </main>
        </div>
    );
} 