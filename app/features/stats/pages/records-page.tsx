import { useLoaderData, useSearchParams, useNavigate, Link, useFetcher, type ActionFunctionArgs, useNavigation } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import MonthlyRecordsTab from "~/features/stats/components/MonthlyRecordsTab";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Calendar } from "~/common/components/ui/calendar";
import React, { useState, useEffect } from "react";
import { Label } from "~/common/components/ui/label";
import type { DailyRecordUI, MemoUI } from "~/features/daily/types";
import type { UICategory, CategoryCode } from "~/common/types/daily";
import { getRequiredProfileId } from "~/features/users/utils";
import { makeSSRClient } from "~/supa-client";
import * as dailyQueries from "~/features/daily/queries";
import * as statsQueries from "~/features/stats/queries";
import * as settingsQueries from "~/features/settings/queries";
import { CATEGORIES } from "~/common/types/daily";
import type { SharedLink, SharedLinkInsert } from "~/features/stats/types";

// Re-register fonts for this page's PDF generation
Font.register({
  family: "Noto Sans KR",
  fonts: [{ src: "/fonts/NotoSansKR-Variable.ttf" }],
});

// Interface for data structure for one day in monthly records
export interface MonthlyDayRecord {
  date: string;
  records: DailyRecordUI[];
  memos: MemoUI[]; // All memos from all records of that day
  dailyNote: string | null;
}

export interface RecordsPageLoaderData {
  profileId: string;
  selectedMonthISO: string; // YYYY-MM (e.g., "2024-03")
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
  startDate: string;
  endDate: string;
  sharedLink: SharedLink | null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const { client } = makeSSRClient(request);
    const profileId = await getRequiredProfileId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === 'upsertShareSettings') {
        try {
            const page_type = 'records';
            const period = formData.get('period') as string;

            if (!period) {
                return { ok: false, error: 'Period is required.' };
            }

            const settings: { [key: string]: any } = {};
            for (const [key, value] of formData.entries()) {
                if (key !== 'is_public' && key !== 'period' && key !== 'intent' && key !== 'page_type') {
                    settings[key] = value === 'true';
                }
            }
            
            const sharedLinkData = {
                profile_id: profileId,
                page_type,
                period,
                is_public: formData.get('is_public') === 'true',
                settings,
            };
            const result = await statsQueries.upsertSharedLink(client, { sharedLinkData: sharedLinkData as SharedLinkInsert & { token: string } });
            return { ok: true, sharedLink: result };
        } catch (error: any) {
            console.error("Error upserting share settings for records page:", error);
            return { ok: false, error: error.message };
        }
    }
    return { ok: false, error: 'Unknown intent' };
};

export const loader = async ({ request }: LoaderFunctionArgs): Promise<RecordsPageLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getRequiredProfileId(request);
  const url = new URL(request.url);
  
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const monthParam = url.searchParams.get("month");

  let startDate: DateTime;
  let endDate: DateTime;

  if (startDateParam && endDateParam) {
    startDate = DateTime.fromISO(startDateParam);
    endDate = DateTime.fromISO(endDateParam);
  } else {
    const baseDate = monthParam ? DateTime.fromISO(`${monthParam}-01`) : DateTime.now();
    startDate = baseDate.startOf("month");
    endDate = baseDate.endOf("month");
  }

  if (!startDate.isValid || !endDate.isValid) {
    // Fallback to current month if params are invalid
    startDate = DateTime.now().startOf("month");
    endDate = DateTime.now().endOf("month");
  }

  const periodForLink = `${startDate.toISODate()}_${endDate.toISODate()}`;

  const [dbRecords, dbNotes, userCategoriesData, userDefaultCodePreferencesData, sharedLink] = await Promise.all([
    dailyQueries.getDailyRecordsByPeriod(client, {
      profileId,
      startDate: startDate.toISODate()!,
      endDate: endDate.toISODate()!,
    }),
    dailyQueries.getDailyNotesByPeriod(client, { 
      profileId,
      startDate: startDate.toISODate()!,
      endDate: endDate.toISODate()!,
    }),
    settingsQueries.getUserCategories(client, { profileId }),
    settingsQueries.getUserDefaultCodePreferences(client, { profileId }),
    statsQueries.getSharedLink(client, { profileId, pageType: 'records', period: periodForLink })
  ]);

  // Handle cases where future dates might return null data
  const safeDbRecords = dbRecords || [];
  const safeDbNotes = dbNotes || [];

  const records: DailyRecordUI[] = safeDbRecords.map((r): DailyRecordUI => ({
    id: r.id!,
    date: r.date,
    category_code: r.category_code as CategoryCode,
    duration_minutes: r.duration_minutes ?? undefined,
    comment: r.comment,
    subcode: r.subcode,
    is_public: r.is_public ?? false,
    linked_plan_id: r.linked_plan_id,
    memos: [], 
    profile_id: r.profile_id!,
  }));

  const recordIds = records.map(r => r.id).filter((id): id is string => !!id);
  const dbMemos = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds(client, { profileId, recordIds }) : [];
  
  const memosByRecordId = new Map<string, MemoUI[]>();
  // Handle cases where future dates might return null data
  (dbMemos || []).forEach(memo => {
    const recordId = memo.record_id;
    if (!recordId) return;
    if (!memosByRecordId.has(recordId)) {
        memosByRecordId.set(recordId, []);
    }
    memosByRecordId.get(recordId)!.push({
        id: memo.id,
        record_id: memo.record_id,
        title: memo.title,
        content: memo.content,
        created_at: memo.created_at,
        updated_at: memo.updated_at,
    });
  });

  records.forEach(rec => {
    rec.memos = memosByRecordId.get(rec.id) || [];
  });
  
  const notesByDate = new Map<string, string>();
  safeDbNotes.forEach(note => {
      notesByDate.set(note.date, note.content);
  });

  const processedCategories: UICategory[] = [];
  const defaultPrefs = new Map((userDefaultCodePreferencesData || []).map(p => [p.default_category_code, p]));

  Object.values(CATEGORIES).forEach(baseCat => {
      const pref = defaultPrefs.get(baseCat.code);
      processedCategories.push({
          ...baseCat,
          isCustom: false,
          isActive: pref ? pref.is_active : true, 
          sort_order: (pref as any)?.sort_order ?? baseCat.sort_order,
      });
  });

  (userCategoriesData || []).forEach(userCat => {
    const existingIndex = processedCategories.findIndex(c => c.code === userCat.code);
    if(existingIndex > -1){
      if(userCat.is_active){ 
        processedCategories[existingIndex] = {
            ...processedCategories[existingIndex],
            label: userCat.label,
            icon: userCat.icon,
            color: userCat.color,
            isCustom: true,
            isActive: userCat.is_active,
            sort_order: userCat.sort_order ?? processedCategories[existingIndex].sort_order,
        };
      } else { 
        processedCategories.splice(existingIndex, 1);
      }
    } else if(userCat.is_active) { 
       processedCategories.push({
        code: userCat.code,
        label: userCat.label,
        icon: userCat.icon || '📝',
        color: userCat.color,
        isCustom: true,
        isActive: true,
        hasDuration: true, 
        sort_order: userCat.sort_order ?? 1000,
      });
    }
  });

  processedCategories.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  const monthlyRecordsForDisplayMap = new Map<string, MonthlyDayRecord>();

  for (let day = startDate; day <= endDate; day = day.plus({ days: 1 })) {
      const dateStr = day.toISODate()!;
      monthlyRecordsForDisplayMap.set(dateStr, {
          date: dateStr,
          records: [],
          memos: [],
          dailyNote: notesByDate.get(dateStr) || null,
      });
  }

  records.forEach(rec => {
      if (monthlyRecordsForDisplayMap.has(rec.date)) {
          const dayData = monthlyRecordsForDisplayMap.get(rec.date)!;
          dayData.records.push(rec);
      }
  });

  const monthlyRecordsForDisplay = Array.from(monthlyRecordsForDisplayMap.values())
      .filter(day => day.records.length > 0 || day.dailyNote)
      .sort((a, b) => a.date.localeCompare(b.date));


  return {
    profileId,
    selectedMonthISO: startDate.toFormat("yyyy-MM"),
    monthlyRecordsForDisplay,
    categories: processedCategories.filter(c => c.isActive),
    startDate: startDate.toISODate()!,
    endDate: endDate.toISODate()!,
    sharedLink: sharedLink as SharedLink | null,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: "Search Records - StartBeyond" },
    { name: "description", content: "Search and filter all your activities, memos, and notes." },
  ];
};

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 50,
    paddingHorizontal: 35,
    fontFamily: "Noto Sans KR",
    fontSize: 9,
  },
  headerText: { fontSize: 18, marginBottom: 15, textAlign: 'center', fontWeight: 'bold' },
  dayContainer: { marginBottom: 15 },
  dayHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 3 },
  recordItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 5 },
  recordCategory: { width: '20%', fontWeight: 'bold' },
  recordSubcode: { width: '25%' },
  recordComment: { flex: 1 },
  recordDuration: { width: '15%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    fontSize: 9,
    color: 'grey',
  },
});

const RecordsReportPDF = ({ data, categories, title }: { data: MonthlyDayRecord[], categories: UICategory[], title: string }) => {
  const getCategoryLabel = (code: string) => categories.find(c => c.code === code)?.label || code;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.headerText}>{title}</Text>
        {data.map(day => (
          <View key={day.date} style={pdfStyles.dayContainer}>
            <Text style={pdfStyles.dayHeader}>{DateTime.fromISO(day.date).toFormat('yyyy-MM-dd ccc')}</Text>
            {day.records.map((record: DailyRecordUI) => (
              <View key={record.id} style={pdfStyles.recordItem}>
                <Text style={pdfStyles.recordCategory}>{getCategoryLabel(record.category_code)}</Text>
                <Text style={pdfStyles.recordSubcode}>{record.subcode || '-'}</Text>
                <Text style={pdfStyles.recordComment}>{record.comment || '-'}</Text>
                <Text style={pdfStyles.recordDuration}>{record.duration_minutes ? `${record.duration_minutes}분` : ''}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={pdfStyles.footer} fixed>
          <Text>StartBeyond</Text>
        </View>
      </Page>
    </Document>
  );
};

function DateRangePicker({
  startDate,
  endDate,
  onApply,
}: {
  startDate: DateTime;
  endDate: DateTime;
  onApply: (start: DateTime, end: DateTime) => void;
}) {
  const { t } = useTranslation();
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [currentEndDate, setCurrentEndDate] = useState(endDate);

  const handleApply = () => {
    onApply(currentStartDate, currentEndDate);
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" className="w-64 justify-start text-left font-normal">
          <Search className="mr-2 h-4 w-4" />
          <span>
          {t("stats_records_page.search_by_period")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div>
            <Label>{t("stats_records_page.start_date")}</Label>
            <Calendar
              selectedDate={currentStartDate}
              onDateChange={(day) => day && setCurrentStartDate(day)}
            />
          </div>
          <div>
            <Label>{t("stats_records_page.end_date")}</Label>
            <Calendar
              selectedDate={currentEndDate}
              onDateChange={(day) => day && setCurrentEndDate(day)}
            />
          </div>
        </div>
        <div className="p-2 border-t flex justify-end">
          <Button onClick={handleApply}>{t("stats_records_page.apply_period")}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function RecordsPage() {
  const { 
    monthlyRecordsForDisplay, 
    categories, 
    startDate: initialStartDate, 
    endDate: initialEndDate,
    sharedLink: initialSharedLink,
  } = useLoaderData<RecordsPageLoaderData>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<typeof action>();
  const navigation = useNavigation();

  const [sharedLink, setSharedLink] = useState<SharedLink | null>(initialSharedLink);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const startDate = DateTime.fromISO(initialStartDate);
  const endDate = DateTime.fromISO(initialEndDate);
  
  const handlePeriodSearch = (start: DateTime, end: DateTime) => {
    const newParams = new URLSearchParams();
    newParams.set("startDate", start.toISODate()!);
    newParams.set("endDate", end.toISODate()!);
    navigate(`?${newParams.toString()}`, { preventScrollReset: true });
  }
  
  const isPeriodSearch = searchParams.has("startDate");

  const periodForLink = isPeriodSearch 
    ? `${startDate.toISODate()}_${endDate.toISODate()}`
    : startDate.toFormat("yyyy-MM");

  useEffect(() => {
    setSharedLink(initialSharedLink);
  }, [initialSharedLink]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok && fetcher.data.sharedLink) {
      setSharedLink(fetcher.data.sharedLink);
    }
  }, [fetcher.state, fetcher.data]);

  const periodControl = (
    <div className="flex items-center gap-1">
      <Button asChild variant="outline" size="icon" disabled={isPeriodSearch}>
        <Link to={`?month=${startDate.minus({ months: 1 }).toFormat("yyyy-MM")}`} preventScrollReset>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <Popover>
        <PopoverTrigger>
          <Button variant="outline" className="w-36" disabled={isPeriodSearch}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate.setLocale(i18n.language).toFormat("yyyy MMMM")}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            selectedDate={startDate}
            onDateChange={(day) => {
              if (day) {
                navigate(`?month=${day.toFormat("yyyy-MM")}`, { preventScrollReset: true });
              }
            }}
          />
        </PopoverContent>
      </Popover>
      <Button asChild variant="outline" size="icon" disabled={isPeriodSearch}>
        <Link to={`?month=${startDate.plus({ months: 1 }).toFormat("yyyy-MM")}`} preventScrollReset>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );

  const description = isPeriodSearch
    ? t("stats_records_page.description_period", {
        startDate: startDate.setLocale(i18n.language).toFormat("yyyy.MM.dd"),
        endDate: endDate.setLocale(i18n.language).toFormat("yyyy.MM.dd"),
      })
    : t("stats_records_page.description_month", {
        month: startDate.setLocale(i18n.language).toFormat("yyyy MMMM"),
      });

  const pdfTitle = isPeriodSearch
    ? t("stats_records_page.pdf_title_period", {
        startDate: startDate.toFormat("yyyy.MM.dd"),
        endDate: endDate.toFormat("yyyy.MM.dd"),
      })
    : t("stats_records_page.pdf_title_month", {
        month: startDate.toFormat("yyyy MMMM"),
      });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSettingsChange = (newSettings: Partial<SharedLink>) => {
    const formData = new FormData();
    formData.append('intent', 'upsertShareSettings');
    formData.append('period', periodForLink);
    
    if (newSettings.is_public !== undefined) {
      formData.append('is_public', String(newSettings.is_public));
    }
    
    const settings = newSettings.settings as { [key: string]: any } | undefined;
    if (settings) {
        Object.entries(settings).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
    }
    fetcher.submit(formData, { method: "post" });
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined' || !sharedLink?.token) return;
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const url = `${baseUrl}/share/${sharedLink.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const pdfDocument = (
        <RecordsReportPDF
          data={monthlyRecordsForDisplay}
          categories={categories}
          title={pdfTitle}
        />
  );

  const pdfButton = isClient ? (
    <PDFDownloadLink
      key={initialStartDate}
      document={pdfDocument}
      fileName={`records-report-${periodForLink}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {loading ? t("stats_header.pdf.loading") : t("stats_header.pdf.download")}
        </Button>
      )}
    </PDFDownloadLink>
  ) : null;
  
  const searchButton = (
      <DateRangePicker 
          startDate={startDate} 
          endDate={endDate}
          onApply={handlePeriodSearch} 
      />
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="mb-4 flex flex-col items-center">
      <StatsPageHeader
        title={t("stats_records_page.title")}
        description={description}
        periodButton={periodControl}
        actionButton={searchButton}
        pdfButton={pdfButton}
        shareSettings={{
          page_type: 'records',
          period: periodForLink,
          is_public: sharedLink?.is_public ?? false,
          settings: sharedLink?.settings ?? { include_records_list: true, include_notes: true },
        }}
        onSettingsChange={handleSettingsChange}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink={sharedLink?.is_public && sharedLink?.token ? (import.meta.env.VITE_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '')) + `/share/${sharedLink.token}` : undefined}
        fetcherState={fetcher.state}
      />
      </div>
      <div className={`mt-6 ${navigation.state === 'loading' ? 'opacity-50 transition-opacity duration-300' : ''}`}>
      <MonthlyRecordsTab
        monthlyRecordsForDisplay={monthlyRecordsForDisplay}
        categories={categories}
      />
      </div>
    </div>
  );
} 