import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useOutletContext } from "react-router";
import * as messageQueries from "../queries";
import { makeSSRClient } from "~/supa-client";
import { getProfileId } from "~/features/users/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { timeAgo } from "~/lib/utils";
import { Link } from "react-router";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { conversationId } = params;
    if (!conversationId) throw new Response("Not Found", { status: 404 });

    const { client } = makeSSRClient(request);
    const profileId = await getProfileId(request);

    const [messages, conversation] = await Promise.all([
        messageQueries.getMessages(client, conversationId),
        messageQueries.getConversationById(client, conversationId, profileId)
    ]);
    
    // Mark messages as read
    await messageQueries.markMessagesAsRead(client, conversationId, profileId);

    if (!conversation) {
        throw new Response("Conversation not found", { status: 404 });
    }

    return { messages, profileId, otherUser: conversation.other_user };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const { conversationId } = params;
    if (!conversationId) throw new Response("Not Found", { status: 404 });
    
    const { client } = makeSSRClient(request);
    const profileId = await getProfileId(request);
    const formData = await request.formData();
    const content = formData.get("content") as string;

    if (!content?.trim()) {
        return { ok: false, error: "Message content cannot be empty." };
    }

    const newMessage = await messageQueries.createMessage(client, {
        conversationId,
        senderId: profileId,
        content,
    });

    return { ok: true, newMessage };
}

export default function ConversationPage() {
    const { messages, profileId, otherUser } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    useEffect(() => {
        if(fetcher.state === 'idle' && fetcher.data?.ok) {
            formRef.current?.reset();
        }
    }, [fetcher.state, fetcher.data]);
    
    const allMessages = [...messages];
    if (fetcher.formData?.get('intent') === 'sendMessage' && fetcher.data?.newMessage) {
        // This is optimistic UI, but needs more robust handling for duplicates
        // allMessages.push(fetcher.data.newMessage);
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-4 border-b flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={otherUser.avatar_url ?? undefined} />
                    <AvatarFallback>{otherUser.username?.[0]}</AvatarFallback>
                </Avatar>
                <Link to={`/users/${otherUser.username}`} className="font-semibold hover:underline">
                    {otherUser.full_name || otherUser.username}
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {allMessages.map((msg, index) => {
                    const isSender = msg.sender_id === profileId;
                    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
                    return (
                        <div
                            key={msg.id || `msg-${index}`}
                            className={cn("flex items-end gap-2", isSender ? "justify-end" : "justify-start")}
                        >
                            {!isSender && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={sender?.avatar_url ?? undefined} />
                                    <AvatarFallback>{sender?.full_name?.[0] || sender?.username?.[0]}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                    "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg",
                                    isSender ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <p className={cn("text-xs mt-1", isSender ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                                   {timeAgo(msg.created_at)}
                                </p>
                            </div>
                            {isSender && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={sender?.avatar_url ?? undefined} />
                                    <AvatarFallback>{sender?.full_name?.[0] || sender?.username?.[0] || 'Me'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
                <fetcher.Form ref={formRef} method="post" className="flex gap-2">
                    <Input name="content" placeholder="Type a message..." autoComplete="off" />
                    <Button type="submit" name="intent" value="sendMessage">Send</Button>
                </fetcher.Form>
            </div>
        </div>
    );
} 