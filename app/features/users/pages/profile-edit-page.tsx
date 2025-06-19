import {
  Form,
  useFetcher,
  useLoaderData,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  useRevalidator,
} from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { makeSSRClient } from "~/supa-client";
import { getProfileId } from "~/features/users/utils";
import * as userQueries from "~/features/users/queries";
import { useState, useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import {
  RadioGroup,
  RadioGroupItem,
} from "~/common/components/ui/radio-group";

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
  const intent = formData.get("intent");

  if (intent === "update_avatar") {
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
      const { data: uploadData, error: uploadError } = await client.storage
        .from("avatars")
        .upload(`${profileId}/${Date.now()}`, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to upload avatar:", uploadError);
        return { ok: false, error: uploadError };
      }

      const { data: urlData } = client.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      await userQueries.updateUserProfile(client, {
        profileId,
        updates: { avatar_url: urlData.publicUrl },
      });
      return { ok: true };
    }
    return { ok: false, error: { message: "No file provided" } };
  }

  if (intent === "update_privacy") {
    const visibility = formData.get("daily_record_visibility") as "public" | "followers" | "private";
    if (["public", "followers", "private"].includes(visibility)) {
      await userQueries.updateUserProfile(client, {
        profileId,
        updates: { daily_record_visibility: visibility },
      });
      return { ok: true };
    }
    return { ok: false, error: { message: "Invalid visibility value" } };
  }

  // Default intent is "update_profile"
  const fullName = formData.get("full_name") as string;

  if (!fullName || fullName.trim().length < 2) {
    return { 
        ok: false, 
        error: { 
            field: 'full_name',
            message: 'name_too_short' 
        } 
    };
  }
  
  const updates = {
    full_name: fullName,
    headline: formData.get("headline") as string,
    bio: formData.get("bio") as string,
  };

  const user = await userQueries.updateUserProfile(client, {
    profileId,
    updates,
  });
  
  if (!user) {
    return { ok: false, message: "Failed to update profile." };
  }

  return redirect(`/users/${user.username}`);
}

export default function ProfileSettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const profileFetcher = useFetcher<typeof action>();
  const avatarFetcher = useFetcher<typeof action>();
  const privacyFetcher = useFetcher<typeof action>();
  const { t } = useTranslation();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    if (avatarFetcher.data?.ok === true && avatarFetcher.state === 'idle') {
      revalidate();
      setAvatarPreview(null);
    }
  }, [avatarFetcher.data, avatarFetcher.state, revalidate]);

  const userProfile = user as any;

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("intent", "update_avatar");
      avatarFetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
    }
  };

  const displayName = userProfile.full_name ?? "";

  const actionData = profileFetcher.data;
  const nameErrorKey =
    actionData && actionData.ok === false && (actionData as any).error?.field === 'full_name'
        ? (actionData as any).error.message
        : null;
  const nameError = nameErrorKey ? t(`settings.profile.errors.${nameErrorKey}`) : null;

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 pt-16 sm:px-6 lg:px-8 min-h-screen">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("settings.profile.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("settings.profile.description")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
       <Card>
            <profileFetcher.Form method="post">
              <input type="hidden" name="intent" value="update_profile" />
            <CardHeader>
                <CardTitle>{t("settings.profile.form_title")}</CardTitle>
                <CardDescription>
                  {t("settings.profile.form_description")}
                </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t("settings.profile.name")}</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={displayName}
                    required
                    minLength={2}
                    aria-invalid={!!nameError}
                    aria-describedby="name-error"
                  />
                  {nameError && <p id="name-error" className="text-sm text-red-500 mt-1">{nameError}</p>}
                  <p className="text-sm text-muted-foreground">
                    {t("settings.profile.name_hint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">
                    {t("settings.profile.headline")}
                  </Label>
                  <Input
                    id="headline"
                    name="headline"
                    defaultValue={userProfile.headline ?? ""}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("settings.profile.headline_hint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">{t("settings.profile.bio")}</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={userProfile.bio ?? ""}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("settings.profile.bio_hint")}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={profileFetcher.state === "submitting"}>
                  {profileFetcher.state === "submitting"
                    ? t("settings.profile.saving")
                    : t("settings.profile.update_profile_button")}
                </Button>
              </CardFooter>
            </profileFetcher.Form>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-8">
          <Card>
            <avatarFetcher.Form method="post" encType="multipart/form-data">
              <input type="hidden" name="intent" value="update_avatar" />
              <CardHeader>
                <CardTitle>{t("settings.profile.avatar_title")}</CardTitle>
                <CardDescription>
                  {t("settings.profile.avatar_description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarPreview || userProfile.avatar_url} />
                  <AvatarFallback>
                    {displayName?.[0] || userProfile.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full space-y-2">
                    <Label htmlFor="avatar" className="sr-only">Choose file</Label>
                    <Input id="avatar" name="avatar" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} disabled={avatarFetcher.state === "submitting"} />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  <p>{t("settings.profile.avatar_size_hint")}</p>
                  <p>{t("settings.profile.avatar_formats_hint")}</p>
                  <p>{t("settings.profile.avatar_max_size_hint")}</p>
                </div>
                {avatarFetcher.state === "submitting" && <p>{t("settings.profile.saving")}</p>}
              </CardContent>
            </avatarFetcher.Form>
          </Card>
          <Card>
            <privacyFetcher.Form method="post">
              <input type="hidden" name="intent" value="update_privacy" />
              <CardHeader>
                <CardTitle>{t("settings.privacy.title")}</CardTitle>
                <CardDescription>
                  {t("settings.privacy.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup name="daily_record_visibility" defaultValue={userProfile.daily_record_visibility}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="followers" id="followers" />
                    <Label htmlFor="followers">{t("settings.privacy.followers_only")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">{t("settings.privacy.public")}</Label>
                  </div>
                </RadioGroup>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={privacyFetcher.state === "submitting"}>
                  {privacyFetcher.state === "submitting"
                    ? t("settings.profile.saving")
                    : t("settings.privacy.save_button")}
                </Button>
            </CardFooter>
            </privacyFetcher.Form>
      </Card>
        </div>
      </div>
    </div>
  );
} 