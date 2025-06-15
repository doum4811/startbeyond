import { makeSSRClient } from "~/supa-client";
import { getVisibleDailyRecords, type DailyRecordWithCategory } from "../queries";
import { getProfileId } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import type { Route } from "./+types/profile-activity-page";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { username } = params;
  if (!username) {
    return { records: [] };
  }

  const { client } = makeSSRClient(request);
  let viewerId: string | null = null;
  try {
    viewerId = await getProfileId(request);
  } catch (e) {
    // Not logged in
  }

  const records = await getVisibleDailyRecords(client, { profileUsername: username, viewerId });
  return { records };
}

export default function ProfileActivityPage({ loaderData }: Route.ComponentProps) {
  const { records } = loaderData;
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-6">
      {records.length > 0 ? (
        records.map((record) => (
          <Card key={record.id}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{record.category?.icon ?? '📝'}</span>
                        <div className="flex flex-col">
                            <span className="font-semibold">{record.category?.label ?? record.category_code}</span>
                            <span className="text-sm text-muted-foreground">{record.comment}</span>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {DateTime.fromISO(record.date).setLocale(i18n.language).toFormat('yyyy-MM-dd')}
                    </div>
                </div>
            </CardHeader>
            {record.duration_minutes ? (
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t('profile.activity.duration', { minutes: record.duration_minutes })}</p>
                </CardContent>
            ) : null}
          </Card>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{t('profile.activity.no_records')}</p>
          <p className="text-muted-foreground">{t('profile.activity.no_records_description')}</p>
        </div>
      )}
    </div>
  );
} 