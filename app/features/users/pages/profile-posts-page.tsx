import { useOutletContext } from "react-router";
import { makeSSRClient } from "~/supa-client";
import { getUserPosts, type Profile } from "../queries";
import type { Route } from "./+types/profile-posts-page";
import { PostList } from "~/features/users/components/post-list";

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

export default function ProfilePostsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PostList posts={loaderData.posts} />
    </div>
  );
} 