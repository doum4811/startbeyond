import { DateTime } from "luxon";
import * as dailyQueries from "~/features/daily/queries";
import * as settingsQueries from "~/features/settings/queries";
import type { LoaderFunctionArgs } from "react-router";
import type { StatsPageLoaderData, MonthlyDayRecord } from "./types";
import { makeSSRClient } from "~/supa-client";

// async function getProfileId(_request?: Request): Promise<string> {
//   return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
// }
async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<StatsPageLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month") || DateTime.now().toFormat("yyyy-MM");
  const monthStart = DateTime.fromFormat(monthParam, "yyyy-MM").startOf("month");
  const monthEnd = monthStart.endOf("month");

  // const [dbRecords, dbNotes, userCategories, userPrefs] = await Promise.all([
  //   dailyQueries.getDailyRecordsByPeriod({
  //     profileId,
  //     startDate: monthStart.toISODate()!,
  //     endDate: monthEnd.toISODate()!,
  //   }),
  //   dailyQueries.getDailyNotesByPeriod({
  //     profileId,
  //     startDate: monthStart.toISODate()!,
  //     endDate: monthEnd.toISODate()!,
  //   }),
  //   settingsQueries.getUserCategories({ profileId }),
  //   settingsQueries.getUserDefaultCodePreferences({ profileId }),
  // ]);

  // ... (기존 stats-page.tsx의 records/memos/notes 가공 로직 복사)
  // MonthlyDayRecord[] 형태로 만드는 부분만 추출하여 리턴

  // (여기서는 예시로 빈 배열 리턴, 실제 구현시 기존 로직 복사)
  return {
    profileId,
    selectedMonthISO: monthParam,
    monthlyRecordsForDisplay: [], // 실제 데이터로 교체
    categories: [], // 실제 데이터로 교체
  };
}; 