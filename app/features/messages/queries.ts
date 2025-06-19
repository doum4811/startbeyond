import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";
// import { conversations, messages } from "./schema";
// import { and, desc, eq, or } from "drizzle-orm";

export async function getOrCreateConversation(
    client: SupabaseClient<any>,
    userId1: string,
    userId2: string
) {
    const { data: existing, error: existingError } = await client
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${userId1},participant2_id.eq.${userId2}),and(participant1_id.eq.${userId2},participant2_id.eq.${userId1})`)
        .single();

    if (existing) {
        return existing.id;
    }

    const { data: newConversation, error: newError } = await client
        .from('conversations')
        .insert({ participant1_id: userId1, participant2_id: userId2 } as any)
        .select('id')
        .single();

    if (newError) {
        console.error("Error creating conversation:", newError);
        throw newError;
    }

    return newConversation!.id;
}

export async function getConversations(
    client: SupabaseClient<any>,
    userId: string
) {
    const { data, error } = await client
        .from('conversations')
        .select(`
            id,
            created_at,
            participant1:profiles!conversations_participant1_id_fkey(profile_id, username, full_name, avatar_url),
            participant2:profiles!conversations_participant2_id_fkey(profile_id, username, full_name, avatar_url),
            last_message:messages(content, created_at, is_read, sender_id)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('created_at', { ascending: false });


    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
    
    const processedConversations = data.map(conv => {
        const p1 = Array.isArray(conv.participant1) ? conv.participant1[0] : conv.participant1;
        const p2 = Array.isArray(conv.participant2) ? conv.participant2[0] : conv.participant2;

        if (!p1 || !p2) {
            return null;
        }

        const other_user = p1.profile_id === userId ? p2 : p1;
        const last_message = Array.isArray(conv.last_message) && conv.last_message.length > 0 ? conv.last_message[0] : null;

        return {
            id: conv.id,
            created_at: conv.created_at,
            other_user: other_user,
            last_message: last_message,
        };
    }).filter(Boolean);


    return processedConversations as any[];
}

export async function getConversationById(
    client: SupabaseClient<any>,
    conversationId: string,
    userId: string
) {
    const { data: conv, error } = await client
        .from('conversations')
        .select(`
            id,
            created_at,
            participant1:profiles!conversations_participant1_id_fkey(profile_id, username, full_name, avatar_url),
            participant2:profiles!conversations_participant2_id_fkey(profile_id, username, full_name, avatar_url)
        `)
        .eq('id', conversationId)
        .single();
    
    if (error) {
        console.error("Error fetching conversation:", error);
        return null;
    }

    const p1 = Array.isArray(conv.participant1) ? conv.participant1[0] : conv.participant1;
    const p2 = Array.isArray(conv.participant2) ? conv.participant2[0] : conv.participant2;

    const other_user = p1.profile_id === userId ? p2 : p1;

    return {
        id: conv.id,
        created_at: conv.created_at,
        other_user: other_user,
    };
}

export async function getMessages(
    client: SupabaseClient<any>,
    conversationId: string
) {
    const { data, error } = await client
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            sender_id,
            sender:profiles (
                username,
                full_name,
                avatar_url
            )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return data;
}

export async function createMessage(
    client: SupabaseClient<any>,
    { conversationId, senderId, content }: { conversationId: string; senderId: string; content: string }
) {
    // 1. Get conversation participants to notify the other user
    const { data: conversationData, error: convError } = await client
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

    if (convError || !conversationData) {
        console.error("Could not fetch conversation to create message notification", convError);
        // We can still proceed to create the message, but notification will fail.
    }

    // 2. Insert the message
    const { data: newMessage, error } = await client
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: content,
        })
        .select(`
            *,
            sender:profiles (
                username,
                full_name,
                avatar_url
            )
        `)
        .single();

    if (error) {
        console.error("Error creating message:", error);
        throw error;
    }

    // 3. Create a notification for the recipient
    if (newMessage && conversationData) {
        const recipientId = conversationData.participant1_id === senderId 
            ? conversationData.participant2_id 
            : conversationData.participant1_id;

        const { error: notificationError } = await client.from('notifications').insert({
            recipient_id: recipientId,
            actor_id: senderId,
            type: 'new_message',
            message: `새로운 메시지가 도착했습니다.`,
            resource_url: `/messages/${conversationId}`
        });

        if (notificationError) {
            // Log the error but don't block the message from being returned
            console.error("Failed to create notification:", notificationError);
        }
    }

    return newMessage;
}

export async function getUnreadMessageCount(client: SupabaseClient<any>, userId: string) {
    const { data: conversations, error: convosError } = await client
        .from('conversations')
        .select('id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

    if (convosError || !conversations) {
        console.error('Error fetching conversations for unread count:', convosError);
        return 0;
    }

    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) {
        return 0;
    }

    const { count, error } = await client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId) 
    
    if (error) {
        console.error('Error fetching unread message count:', error);
        return 0;
    }
    
    return count ?? 0;
}

export async function markMessagesAsRead(client: SupabaseClient<any>, conversationId: string, userId: string) {
    const { error } = await client
        .from('messages')
        .update({ is_read: true } as any)
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

    if (error) {
        console.error('Error marking messages as read:', error);
    }
} 