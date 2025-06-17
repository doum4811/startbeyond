import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, useFetcher } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import { getProfileId } from "~/features/users/utils";
import * as userQueries from "~/features/users/queries";
import { makeSSRClient } from "~/supa-client";

export const meta: MetaFunction = () => {
  return [{ title: "Profile Settings | StartBeyond" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const user = await userQueries.getUserProfileById(client, { profileId });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  
  const updates = {
    full_name: formData.get("full_name") as string,
    headline: formData.get("headline") as string,
    bio: formData.get("bio") as string,
  };

  const user = await userQueries.updateUserProfile(client, { profileId, updates });
  
  if (!user) {
    return { ok: false, error: "Failed to update profile." };
  }

  return { ok: true, user };
}

export default function ProfileSettingsPage({ loaderData, actionData }: any) {
  const { user } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
       <Card>
        <fetcher.Form method="post">
            <CardHeader>
                <CardTitle>{t('settings.profile.title')}</CardTitle>
                <CardDescription>
                {t('settings.profile.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="full_name">{t('settings.profile.name')}</Label>
                    <Input id="full_name" name="full_name" defaultValue={user.full_name ?? ""} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="headline">{t('settings.profile.headline')}</Label>
                    <Input id="headline" name="headline" defaultValue={user.headline ?? ""} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
                    <Textarea id="bio" name="bio" defaultValue={user.bio ?? ""} rows={4} />
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={fetcher.state === 'submitting'}>
                    {fetcher.state === 'submitting' ? t('settings.profile.saving') : t('settings.profile.save_changes')}
                </Button>
            </CardFooter>
        </fetcher.Form>
      </Card>
    </div>
  );
} 