import { useOutletContext, redirect } from "react-router";
import type { Route } from "./+types/profile-page";
import { makeSSRClient } from "~/supa-client";
import { useTranslation } from "react-i18next";
import { getProfileId } from "../utils";
import { getUserProfile, followUser, unfollowUser, getUserProfileById } from "../queries";
import { getOrCreateConversation } from "~/features/messages/queries";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  await client.rpc("track_event", {
    event_type: "profile_view",
    event_data: {
      username: params.username,
    },
  });
  return null;
};

export async function action({ request, params }: Route.ActionArgs) {
    const { client } = makeSSRClient(request);
    const currentUserId = await getProfileId(request);
    const { username } = params;

    const [targetUser, currentUser] = await Promise.all([
        getUserProfile(client, { username: username! }),
        getUserProfileById(client, { profileId: currentUserId })
    ]);

    if (!targetUser) {
        throw new Response("Target user not found", { status: 404 });
    }
    
    if (!currentUser) {
        throw new Response("Current user not found", { status: 404 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "follow") {
        await followUser(client, { followerId: currentUserId, followingId: targetUser.profile_id });
        
        await client.from('notifications').insert({
            recipient_id: targetUser.profile_id,
            actor_id: currentUserId,
            type: 'new_follower',
            message: `${currentUser.full_name ?? 'Someone'}님이 회원님을 팔로우하기 시작했습니다.`,
            resource_url: `/users/${currentUser.username}` 
        });

    } else if (intent === "unfollow") {
        await unfollowUser(client, { followerId: currentUserId, followingId: targetUser.profile_id });
    } else if (intent === "message") {
        const conversationId = await getOrCreateConversation(client, currentUserId, targetUser.profile_id);
        return redirect(`/messages/${conversationId}`);
    }

    return { ok: true };
}

export default function ProfilePage() {
  const { headline, bio } = useOutletContext<{
    headline: string;
    bio: string;
  }>();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col space-y-10">
      <div className="space-y-2">
        <h4 className="text-lg font-bold">{t('profile.headline')}</h4>
        <p className="text-muted-foreground">{headline}</p>
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold">{t('profile.bio')}</h4>
        <p className="text-muted-foreground">{bio}</p>
      </div>
    </div>
  );
}