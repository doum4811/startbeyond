import {
  Form,
  useFetcher,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "~/common/components/ui/alert-dialog";
import { getRequiredProfileId } from '~/features/users/utils';
import { Alert, AlertDescription, AlertTitle } from "~/common/components/ui/alert";
import { AlertCircle } from "lucide-react";

type ProfileEditPageLoaderData = Awaited<ReturnType<typeof loader>>;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, headers } = makeSSRClient(request);
  const { username } = params;

  if (!username) {
    throw new Response("Username not provided in URL", { status: 400, headers });
  }

  const loggedInProfileId = await getRequiredProfileId(request);
  const userToEdit = await userQueries.getUserProfile(client, { username });

  if (!userToEdit) {
    throw new Response("User not found", { status: 404, headers });
  }
  
  if (userToEdit.profile_id !== loggedInProfileId) {
    return redirect(`/users/${userToEdit.username}`);
  }

  return { user: userToEdit };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { client, headers } = makeSSRClient(request);
  const { username } = params;

  if (!username) {
    throw new Response("Username not provided in URL", { status: 400, headers });
  }

  const loggedInProfileId = await getRequiredProfileId(request);
  const userToEdit = await userQueries.getUserProfile(client, { username });

  if (!userToEdit || userToEdit.profile_id !== loggedInProfileId) {
    throw new Response("You are not authorized to perform this action.", { status: 403, headers });
  }
  
  const profileId = loggedInProfileId;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update_avatar") {
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
       const MAX_SIZE = 1 * 1024 * 1024; // 1MB
       if (avatarFile.size > MAX_SIZE) {
           return { ok: false, error: { message: "fileTooLarge" } };
       }
       const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
        if (!ALLOWED_TYPES.includes(avatarFile.type)) {
            return { ok: false, error: { message: "invalidFileType" } };
        }

      const { data: uploadData, error: uploadError } = await client.storage
        .from("avatars")
        .upload(`${profileId}/${Date.now()}`, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        return { ok: false, error: uploadError };
      }

      const { data: urlData } = client.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      await userQueries.updateUserProfile(client, {
        profileId,
        updates: { avatar_url: urlData.publicUrl },
      });
      return redirect(`/users/${username}/edit`, { headers });
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

  if (intent === "delete_account") {
    const { error } = await client.rpc('delete_user');
    if (error) {
      return { ok: false, error: { message: "Failed to delete account." } };
    }
    return redirect("/", { headers });
  }

  const fullName = formData.get("full_name") as string;

  if (!fullName || fullName.trim().length < 1) {
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

  return redirect(`/users/${user.username}`, { headers });
}

interface ProfileSettingsPageProps {
  loaderData: ProfileEditPageLoaderData;
}

export default function ProfileSettingsPage({ loaderData }: ProfileSettingsPageProps) {
  if (loaderData instanceof Response) {
    return null;
  }
  
  const { user } = loaderData;

  if (!user) {
    return <div>User not found.</div>;
  }

  const profileFetcher = useFetcher<typeof action>();
  const avatarFetcher = useFetcher<typeof action>();
  const privacyFetcher = useFetcher<typeof action>();
  const deleteAccountFetcher = useFetcher<typeof action>();
  const { t } = useTranslation();
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  
  useEffect(() => {
    const errorData = avatarFetcher.data as any;
    if (avatarFetcher.data?.ok === false && errorData.error?.message) {
        setAvatarError(t(`settings.profile.errors.${errorData.error.message}`));
    }
  }, [avatarFetcher.data, t]);


  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarPreview(null);
    setAvatarFile(null);

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const MAX_SIZE = 1 * 1024 * 1024; // 1MB
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

      if (file.size > MAX_SIZE) {
        setAvatarError(t('settings.profile.errors.fileTooLarge'));
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setAvatarError(t('settings.profile.errors.invalidFileType'));
        return;
      }
      
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const userProfile = user as any;
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
        <div className="md:col-span-2 space-y-8">
            {/* Avatar Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.profile.avatar.title")}</CardTitle>
                    <CardDescription>{t("settings.profile.avatar.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                     <avatarFetcher.Form method="post" encType="multipart/form-data" onSubmit={() => setAvatarError(null)}>
                        <input type="hidden" name="intent" value="update_avatar" />
                        <div className="flex items-center gap-6">
                            <Label htmlFor="avatar-upload">
                                <Avatar className="h-20 w-20 cursor-pointer">
                                <AvatarImage src={avatarPreview ?? userProfile.avatar_url} />
                                <AvatarFallback>
                                    {displayName.charAt(0)}
                                </AvatarFallback>
                                </Avatar>
                            </Label>
                            <input
                                id="avatar-upload"
                                name="avatar"
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleAvatarChange}
                            />
                            <div className="space-y-2">
                                <p className="font-semibold">{t("settings.profile.avatar.requirementsTitle")}</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    <li>{t("settings.profile.avatar.requirementsSize")}</li>
                                    <li>{t("settings.profile.avatar.requirementsFormats")}</li>
                                    <li>{t("settings.profile.avatar.requirementsMaxSize")}</li>
                                </ul>
                            </div>
                        </div>
                        {avatarError && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{avatarError}</AlertDescription>
                            </Alert>
                        )}
                         <div className="pt-4">
                            <Button type="submit" disabled={!avatarFile || avatarFetcher.state !== 'idle'}>
                                {avatarFetcher.state === 'submitting' ? t('settings.saving') : t('settings.profile.avatar.updateButton')}
                            </Button>
                        </div>
                    </avatarFetcher.Form>
                </CardContent>
            </Card>

            {/* Profile Info Card */}
            <Card>
                <profileFetcher.Form method="post">
                <input type="hidden" name="intent" value="update_profile" />
                <CardHeader>
                    <CardTitle>{t("settings.profile.form_title")}</CardTitle>
                    <CardDescription>
                    {t("settings.profile.form_description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">{t("settings.profile.name_label")}</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={displayName}
                        />
                         {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="headline">{t("settings.profile.headline_label")}</Label>
                        <Input
                            id="headline"
                            name="headline"
                            defaultValue={userProfile.headline ?? ""}
                            placeholder={t("settings.profile.headline_placeholder")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">{t("settings.profile.bio_label")}</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            rows={4}
                            defaultValue={userProfile.bio ?? ""}
                            placeholder={t("settings.profile.bio_placeholder")}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={profileFetcher.state !== 'idle'}>
                         {profileFetcher.state === 'submitting' ? t('settings.saving') : t('settings.profile.update_button')}
                    </Button>
                </CardFooter>
                </profileFetcher.Form>
            </Card>
        </div>

        <div className="space-y-8">
            {/* Privacy Card */}
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
                        <RadioGroup name="daily_record_visibility" defaultValue={user.daily_record_visibility}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="public" id="r1" />
                                <Label htmlFor="r1">{t("settings.privacy.public")}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="followers" id="r2" />
                                <Label htmlFor="r2">{t("settings.privacy.followers_only")}</Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={privacyFetcher.state !== 'idle'}>
                            {privacyFetcher.state === 'submitting' ? t('settings.saving') : t('settings.privacy.save_button')}
                        </Button>
                    </CardFooter>
                </privacyFetcher.Form>
            </Card>
        </div>
      </div>
        {/* Delete Account Card */}
        <div className="mt-8">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">{t("settings.danger_zone.title")}</CardTitle>
                    <CardDescription>{t("settings.danger_zone.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">{t("settings.danger_zone.delete_account")}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <deleteAccountFetcher.Form method="post">
                                <input type="hidden" name="intent" value="delete_account" />
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t("settings.danger_zone.confirm_title")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t("settings.danger_zone.confirm_description")}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t("settings.cancel")}</AlertDialogCancel>
                                    <Button type="submit" variant="destructive" disabled={deleteAccountFetcher.state !== 'idle'}>
                                        {t("settings.danger_zone.confirm_delete")}
                                    </Button>
                                </AlertDialogFooter>
                            </deleteAccountFetcher.Form>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
