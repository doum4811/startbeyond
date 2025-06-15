import { Form, useFetcher, useLoaderData, redirect } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { makeSSRClient } from "~/supa-client";
import { getProfileId } from "~/features/users/utils";
import * as userQueries from "~/features/users/queries";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/common/components/ui/select";

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
    // daily_record_visibility: formData.get("daily_record_visibility") as string,
  };

  const user = await userQueries.updateUserProfile(client, { profileId, updates });
  
  if (!user) {
    // Or handle error appropriately
    return { ok: false, message: "Failed to update profile." };
  }

  return redirect(`/users/${user.username}`);
}

export default function ProfileSettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation();

  // The user object type might be stale until migrations and type generation are run.
  // We cast to any to prevent transient linter errors.
  const userProfile = user as any;

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 pt-16 sm:px-6 lg:px-8 min-h-screen">
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
                    <Input id="full_name" name="full_name" defaultValue={userProfile.full_name ?? ""} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="headline">{t('settings.profile.headline')}</Label>
                    <Input id="headline" name="headline" defaultValue={userProfile.headline ?? ""} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
                    <Textarea id="bio" name="bio" defaultValue={userProfile.bio ?? ""} rows={4} />
                </div>
                {/* <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{t('settings.profile.visibility.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.profile.visibility.description')}
                    </p>
                  </div>
                  <Select name="daily_record_visibility" defaultValue={userProfile.daily_record_visibility ?? 'followers'}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.profile.visibility.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t('settings.profile.visibility.public')}</SelectItem>
                      <SelectItem value="followers">{t('settings.profile.visibility.followers')}</SelectItem>
                      <SelectItem value="private">{t('settings.profile.visibility.private')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
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