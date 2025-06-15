import { useOutletContext, redirect } from "react-router";
import { makeSSRClient } from "~/supa-client";
import { getUserPosts, type Profile, getUserProfile, followUser, unfollowUser } from "../queries";
import type { Route } from "./+types/profile-posts-page";
import { PostList } from "~/features/users/components/post-list";
import { getProfileId } from "../utils";
import { getOrCreateConversation } from "~/features/messages/queries";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  if (!params.username) {
    return { posts: [] };
  }
  const { client } = makeSSRClient(request);
  // We need to get the user from the layout, but for now we can't directly.
  // We'll fetch the user again here. A better approach might be to lift state or use a different router pattern.
  const { data: user } = await client
    .from("profiles")
    .select("profile_id, username")
    .eq("username", params.username)
    .single();

  if (!user) {
    // Or throw a 404
    return { posts: [] };
  }

  const posts = await getUserPosts(client, { userId: user.profile_id });

  return { posts: posts || [] };
};

export async function action({ request, params }: Route.LoaderArgs) {
    const { client } = makeSSRClient(request);
    const currentUserId = await getProfileId(request);
    const { username } = params;

    const targetUser = await getUserProfile(client, { username: username! });
    if (!targetUser) {
        throw new Response("Target user not found", { status: 404 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "follow") {
        await followUser(client, { followerId: currentUserId, followingId: targetUser.profile_id });
        
        // await client.from('notifications').insert({
        //     recipient_id: targetUser.profile_id,
        //     actor_id: currentUserId,
        //     type: 'new_follower',
        //     resource_url: `/users/${params.username}` 
        // });

    } else if (intent === "unfollow") {
        await unfollowUser(client, { followerId: currentUserId, followingId: targetUser.profile_id });
    } else if (intent === "message") {
        const conversationId = await getOrCreateConversation(client, currentUserId, targetUser.profile_id);
        return redirect(`/messages/${conversationId}`);
    }

    return { ok: true };
}

export default function ProfilePostsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PostList posts={loaderData.posts} />
    </div>
  );
} 