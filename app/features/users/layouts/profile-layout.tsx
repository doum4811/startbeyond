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
import { getUserProfile, getFollowStatus, getFollowCounts } from "../queries";
import { makeSSRClient } from "~/supa-client";

type ProfileLayoutLoaderData = Awaited<ReturnType<typeof loader>>;

export const meta: Route.MetaFunction = ({ data }) => {
  const pageData = data as Exclude<ProfileLayoutLoaderData, Response>;
  if (!pageData?.user) {
    return [{ title: "User not found | startbeyond" }];
  }
  return [{ title: `${pageData.user.full_name} | startbeyond` }];
};

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);
  const { username } = params;

  if (!username) {
    throw new Response("Not Found", { status: 404, headers });
  }

  const { data: { user: authUser } } = await client.auth.getUser();
  if (!authUser) {
    return redirect("/auth/login", { headers });
  }
  const currentUserId = authUser.id;

  const user = await getUserProfile(client, { username });
  if (!user) {
    throw new Response("Not Found", { status: 404, headers });
  }

  const isOwnProfile = currentUserId === user.profile_id;
  let isFollowing = false;
  if (!isOwnProfile) {
      const status = await getFollowStatus(client, { followerId: currentUserId, followingId: user.profile_id });
      isFollowing = status.isFollowing;
  }
  
  const { followers, following } = await getFollowCounts(client, { userId: user.profile_id });

  return { user, isFollowing, followers, following, isOwnProfile };
};

export default function ProfileLayout({
  loaderData,
  params,
}: Route.ComponentProps) {
  if (loaderData instanceof Response) {
    return null;
  }
  const { user, isFollowing, followers, following, isOwnProfile } = loaderData;
  const fetcher = useFetcher();
  
  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 pt-16 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar className="size-40 flex-shrink-0">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} />
          ) : (
            <AvatarFallback className="text-2xl">
              {user.full_name ? user.full_name[0] : ''}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-semibold break-all">{user.full_name}</h1>
            {isOwnProfile ? (
              <Button variant="outline" asChild>
                <Link to={`/users/${user.username}/edit`}>Edit profile</Link>
              </Button>
            ) : (
              <div className="flex gap-2">
                <fetcher.Form method="post" action={`/users/${user.username}`}>
                  <Button
                    type="submit"
                    name="intent"
                    value={isFollowing ? "unfollow" : "follow"}
                    variant={isFollowing ? "secondary" : "default"}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                </fetcher.Form>
                <fetcher.Form method="post" action={`/users/${user.username}`}>
                  <Button variant="secondary" type="submit" name="intent" value="message">
                    Message
                  </Button>
                </fetcher.Form>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
          {
            label: "Activity",
            to: `/users/${user.username}/activity`,
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
      <div className="w-full">
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