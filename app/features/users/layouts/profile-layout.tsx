import { Form, Link, NavLink, Outlet, useFetcher, useOutletContext, redirect } from "react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Badge } from "~/common/components/ui/badge";
import { Button, buttonVariants } from "~/common/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "~/common/components/ui/dialog";
import { Textarea } from "~/common/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/profile-layout";
import { getUserProfile, getFollowStatus, getFollowCounts, followUser, unfollowUser } from "../queries";
import { makeSSRClient } from "~/supa-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileId } from "../utils";
import * as notificationQueries from "~/features/notifications/queries";
import { getOrCreateConversation } from "~/features/messages/queries";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.user) {
    return [{ title: "User not found | startbeyond" }];
  }
  return [{ title: `${data.user.full_name} | startbeyond` }];
};

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const { username } = params;

  if (!username) {
    throw new Response("Not Found", { status: 404 });
  }

  const user = await getUserProfile(client, { username });
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  let currentUserId: string | null = null;
  try {
    currentUserId = await getProfileId(request);
  } catch (e) {
    // Not logged in, fine to proceed
  }
  
  const isOwnProfile = currentUserId === user.profile_id;
  let isFollowing = false;
  if (currentUserId && !isOwnProfile) {
      const status = await getFollowStatus(client, { followerId: currentUserId, followingId: user.profile_id });
      isFollowing = status.isFollowing;
  }
  
  const { followers, following } = await getFollowCounts(client, { userId: user.profile_id });

  return { user, isFollowing, followers, following, isOwnProfile };
};

export async function action({ request, params }: Route.ActionArgs) {
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
        
        // Add a notification for the followed user
        await client.from('notifications').insert({
            recipient_id: targetUser.profile_id,
            actor_id: currentUserId,
            type: 'new_follower',
            resource_url: `/users/${params.username}` 
        });

    } else if (intent === "unfollow") {
        await unfollowUser(client, { followerId: currentUserId, followingId: targetUser.profile_id });
    } else if (intent === "message") {
        const conversationId = await getOrCreateConversation(client, currentUserId, targetUser.profile_id);
        return redirect(`/messages/${conversationId}`);
    }

    return { ok: true };
}

export default function ProfileLayout({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { user, isFollowing, followers, following, isOwnProfile } = loaderData;
  const fetcher = useFetcher();
  
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Avatar className="size-40">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} />
          ) : (
            <AvatarFallback className="text-2xl">
              {user.full_name ? user.full_name[0] : ''}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-5">
          <div className="flex gap-2 items-center">
            <h1 className="text-2xl font-semibold">{user.full_name}</h1>
            {isOwnProfile ? (
              <Button variant="outline" asChild>
                <Link to="/settings/profile">Edit profile</Link>
              </Button>
            ) : (
              <fetcher.Form method="post">
                <Button 
                    type="submit" 
                    name="intent"
                    value={isFollowing ? "unfollow" : "follow"}
                    variant={isFollowing ? "secondary" : "default"}
                >
                    {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </fetcher.Form>
            )}
            <fetcher.Form method="post">
                <Button variant="secondary" type="submit" name="intent" value="message">
                    Message
                </Button>
            </fetcher.Form>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              @{user.username}
            </span>
            <Badge variant={"secondary"}>{followers} followers</Badge>
            <Badge variant={"secondary"}>{following} following</Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-5">
        {[
          { label: "About", to: `/users/${user.username}` },
          {
            label: "Posts",
            to: `/users/${user.username}/posts`,
          },
        ].map((item) => (
          <NavLink
            end
            key={item.label}
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: "outline" }),
                isActive && "bg-accent text-foreground "
              )
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="max-w-screen-md">
        <Outlet
          context={{
            headline: user.headline,
            bio: user.bio,
          }}
        />
      </div>
    </div>
  );
}