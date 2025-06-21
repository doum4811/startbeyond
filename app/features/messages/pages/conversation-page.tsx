import { useFetcher, useLoaderData, useParams } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import * as messageQueries from "~/features/messages/queries";
import { getRequiredProfileId } from "~/features/users/utils";
import { makeSSRClient } from "~/supa-client";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { SendHorizonal } from "lucide-react";
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from "react-i18next";
import { MessageBubble } from "../components/message-bubble";
import { redirect } from "react-router";
import type { Database } from "database.types";
import type { Profile } from "~/features/users/queries";

type MessageFromRPC = Awaited<ReturnType<typeof messageQueries.getMessages>>[number];

type LoaderData = Awaited<ReturnType<typeof loader>>;
type NonRedirectLoaderData = Exclude<LoaderData, Response>;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const loaderData = data as LoaderData;
    if (loaderData instanceof Response || !loaderData.conversation) {
        return [{ title: 'Conversation | startbeyond' }];
    }
    const otherUser = loaderData.conversation.other_user;
    const title = `Conversation with ${otherUser.full_name || otherUser.username}`;
    return [{ title }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { conversationId } = params;
    if (!conversationId) return redirect("/messages");
    
    const { client, headers } = makeSSRClient(request);
    try {
        const profileId = await getRequiredProfileId(request);

        const [conversation, messages] = await Promise.all([
            messageQueries.getConversationById(client, conversationId, profileId),
            messageQueries.getMessages(client, conversationId)
        ]);

        if (!conversation) return redirect("/messages", { headers });

        await messageQueries.markMessagesAsRead(client, conversationId, profileId);

        return { conversation, messages, profileId };
    } catch (error) {
        if (error instanceof Response) return error;
        return redirect("/auth/login", { headers });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    const { conversationId } = params;
    if (!conversationId) return { ok: false, error: "Conversation ID is missing" };

    const { client, headers } = makeSSRClient(request);
    try {
        const senderId = await getRequiredProfileId(request);
        const formData = await request.formData();
        const content = formData.get("content") as string;

        if (!content?.trim()) return { ok: false, error: "Message content cannot be empty" };

        const newMessage = await messageQueries.createMessage(client, { conversationId, senderId, content });

        return { ok: true, newMessage };
    } catch (error) {
        if (error instanceof Response) return error;
        return redirect("/auth/login", { headers });
    }
}

export default function ConversationPage() {
    const initialData = useLoaderData() as NonRedirectLoaderData;
    const fetcher = useFetcher<typeof action>();
    const { t } = useTranslation();
    const { conversationId } = useParams();

    const [messages, setMessages] = useState(initialData.messages);
    const [inputValue, setInputValue] = useState('');
    const currentUserId = initialData.profileId;
    const otherUser = initialData.conversation.other_user;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const data = fetcher.data;
        if (fetcher.state === 'idle' && data && 'ok' in data && data.ok && data.newMessage) {
            setMessages(prev => [...prev, data.newMessage as MessageFromRPC]);
            setInputValue('');
        }
    }, [fetcher.data, fetcher.state]);
    
    return (
        <>
            <header className="flex items-center gap-4 border-b bg-background p-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.avatar_url ?? undefined} alt={otherUser.full_name ?? undefined} />
                    <AvatarFallback>{otherUser.full_name?.[0] ?? otherUser.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="font-semibold">
                    {otherUser.full_name ?? otherUser.username}
                    <div className="text-xs text-muted-foreground">@{otherUser.username}</div>
                </div>
            </header>
            <div className="h-[50vh] overflow-y-scroll p-4 space-y-4">
                {messages.map((msg) => {
                    const isCurrentUser = msg.sender_id === currentUserId;
                    const senderProfile = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
                    
                    if (!senderProfile) return null; // or a placeholder

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg.content}
                            isCurrentUser={isCurrentUser}
                            author={senderProfile}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto border-t bg-background p-4">
                <fetcher.Form method="post" action={`/messages/${conversationId}`} className="flex items-center gap-2">
                    <Input
                        name="content"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t("messages.type_a_message")}
                        autoComplete="off"
                        className="flex-1"
                        disabled={fetcher.state === 'submitting'}
                    />
                    <Button type="submit" size="icon" disabled={fetcher.state === 'submitting' || !inputValue.trim()}>
                        <SendHorizonal className="h-5 w-5" />
                    </Button>
                </fetcher.Form>
            </div>
        </>
    );
} 