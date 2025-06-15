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

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { conversationId } = params;
    if (!conversationId) throw new Response("Not Found", { status: 404 });

    const { client } = makeSSRClient(request);
    const profileId = await getProfileId(request);

    const messages = await messageQueries.getMessages(client, conversationId);
    
    // Mark messages as read
    await messageQueries.markMessagesAsRead(client, conversationId, profileId);

    return { messages, profileId };
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
    const { messages, profileId } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const allMessages = [...messages];
    if (fetcher.formData?.get('intent') === 'sendMessage' && fetcher.data?.newMessage) {
        // This is optimistic UI, but needs more robust handling for duplicates
        // allMessages.push(fetcher.data.newMessage);
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
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
                                    <AvatarFallback>{sender?.username?.[0]}</AvatarFallback>
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
                                    <AvatarFallback>{sender?.username?.[0] || 'Me'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
                <fetcher.Form method="post" className="flex gap-2">
                    <Input name="content" placeholder="Type a message..." autoComplete="off" />
                    <Button type="submit" name="intent" value="sendMessage">Send</Button>
                </fetcher.Form>
            </div>
        </div>
    );
} 
// import { Form, useFetcher, useLoaderData } from "react-router";
// import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
// import { makeSSRClient } from "~/supa-client";
// import * as messageQueries from "../queries";
// import { getProfileId } from "~/features/users/utils";
// import { MessageBubble } from "../components/message-bubble";
// import { Button } from "~/common/components/ui/button";
// import { Input } from "~/common/components/ui/input";
// import { SendIcon } from "lucide-react";
// import { useEffect, useRef } from "react";
// import { useTranslation } from "react-i18next";
// import type { Profile } from "~/features/users/queries";

// // A simplified profile type for this page's context
// type SimpleProfile = Pick<Profile, 'profile_id' | 'username' | 'full_name' | 'avatar_url'>;

// export async function loader({ request, params }: LoaderFunctionArgs) {
//   const { conversationId } = params;
//   if (!conversationId) {
//     throw new Response("Conversation not found", { status: 404 });
//   }

//   const { client } = makeSSRClient(request);
//   const currentUserId = await getProfileId(request);

//   const { data: convData, error: convError } = await client
//     .from('conversations')
//     .select(`
//       id,
//       participant1:profiles!conversations_participant1_id_fkey(*),
//       participant2:profiles!conversations_participant2_id_fkey(*)
//     `)
//     .eq('id', conversationId)
//     .single();

//   if (convError || !convData) {
//     throw new Response("Conversation not found", { status: 404 });
//   }

//   const otherUser = convData.participant1.profile_id === currentUserId 
//     ? convData.participant2 as SimpleProfile
//     : convData.participant1 as SimpleProfile;

//   if (!otherUser) {
//     throw new Response("Conversation partner not found", { status: 404 });
//   }

//   const messages = await messageQueries.getMessages(client, conversationId);

//   return { messages, currentUserId, otherUser, conversationId };
// }

// export async function action({ request, params }: ActionFunctionArgs) {
//     const { conversationId } = params;
//     if (!conversationId) {
//       throw new Response("Conversation not found", { status: 404 });
//     }
  
//     const { client } = makeSSRClient(request);
//     const senderId = await getProfileId(request);
//     const formData = await request.formData();
//     const content = formData.get("content") as string;
  
//     if (content?.trim()) {
//       await messageQueries.createMessage(client, {
//         conversationId,
//         senderId,
//         content,
//       });
//     }
  
//     return { ok: true };
// }

// type MessageWithAuthor = Awaited<ReturnType<typeof messageQueries.getMessages>>[number];

// export default function ConversationPage() {
//     const { messages, currentUserId, otherUser, conversationId } = useLoaderData<typeof loader>();
//     const fetcher = useFetcher();
//     const { t } = useTranslation();
//     const scrollContainerRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         if (scrollContainerRef.current) {
//             scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
//         }
//     }, [messages]);

//     const currentUserProfile: SimpleProfile = {
//       profile_id: currentUserId,
//       username: 'You',
//       full_name: 'You',
//       avatar_url: null,
//     };

//     return (
//         <div className="flex flex-col h-[calc(100vh-10rem)]">
//             <div className="p-4 border-b">
//                 <h2 className="text-xl font-semibold">{otherUser.full_name ?? otherUser.username}</h2>
//             </div>
//             <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {messages.map((msg: MessageWithAuthor) => (
//                     <MessageBubble 
//                         key={msg.id}
//                         message={msg.content}
//                         isCurrentUser={msg.sender_id === currentUserId}
//                         author={msg.sender_id === currentUserId ? currentUserProfile : otherUser}
//                     />
//                 ))}
//             </div>
//             <div className="p-4 border-t">
//                 <fetcher.Form method="post" action={`/messages/${conversationId}`} className="flex items-center gap-2">
//                     <Input name="content" placeholder={t('messages.type_a_message')} autoComplete="off" />
//                     <Button type="submit" size="icon" disabled={fetcher.state === "submitting"}>
//                         <SendIcon className="size-4" />
//                     </Button>
//                 </fetcher.Form>
//             </div>
//         </div>
//     );
// } 