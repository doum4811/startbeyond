import { getProfileId } from "../utils";
import { makeSSRClient } from "~/supa-client";
import { getUserProfile, getVisibleDailyRecords } from "../queries";
import type { Route } from "./+types/profile-activity-page";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/common/components/ui/collapsible";
import { Button } from "~/common/components/ui/button";
import { ChevronsUpDown, MessageSquare } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { client } = makeSSRClient(request);
  const { username } = params;

  const profile = await getUserProfile(client, { username: username! });
  if (!profile) {
    throw new Response("Not Found", { status: 404 });
  }

  let viewerId: string | null = null;
  try {
    viewerId = await getProfileId(request);
  } catch (e) {
    // Not logged in
  }

  const { data: records, error } = await getVisibleDailyRecords(client, {
    profileId: profile.profile_id,
    viewerId,
  });

  return { records, error, username };
}

function ActivityCard({ record }: { record: any }) {
  const { t } = useTranslation();
  const hasMemos = record.memos && record.memos.length > 0;

  return (
    <Card>
            <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{record.comment || t('profile.activity.no_comment')}</CardTitle>
            <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
          {record.duration_minutes && (
            <div className="text-sm font-medium bg-secondary text-secondary-foreground rounded-md px-2 py-1">
              {t('profile.activity.duration', { minutes: record.duration_minutes })}
                    </div>
          )}
                    </div>
      </CardHeader>
      {hasMemos && (
        <CardContent>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{t('profile.activity.view_memos', { count: record.memos.length })}</span>
                <ChevronsUpDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {record.memos.map((memo: any) => (
                <div key={memo.id} className="border-l-2 pl-4 ml-4">
                  <p className="font-semibold">{memo.title}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{memo.content}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
                </CardContent>
      )}
          </Card>
  );
}

export default function ProfileActivityPage({
  loaderData,
}: Route.ComponentProps) {
  const { records, error, username } = loaderData;
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-8 space-y-4">
        <h3 className="text-xl font-semibold">
          {t("profile.activity.error_title", "Error")}
        </h3>
        <p className="text-muted-foreground">
          {t("profile.activity.error_description", "Could not load activity.")}
        </p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {t("profile.activity.no_activity")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record: any) => (
        <ActivityCard key={record.id} record={record} />
      ))}
    </div>
  );
} 