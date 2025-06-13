import { useLoaderData, useSearchParams, useNavigate, Link } from "react-router";
import type { MetaFunction, LoaderFunction } from "react-router";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import MonthlyRecordsTab from "~/features/stats/components/MonthlyRecordsTab";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { loader as recordsLoader, type RecordsLoaderData } from "../records-loader";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Calendar } from "~/common/components/ui/calendar";
import React, { useState, useEffect } from "react";
import { Label } from "~/common/components/ui/label";
import type { MonthlyDayRecord, DailyRecordUI } from "../types";
import type { UICategory } from "~/common/types/daily";

// Re-register fonts for this page's PDF generation
Font.register({
  family: "Noto Sans KR",
  fonts: [{ src: "/fonts/NotoSansKR-Variable.ttf" }],
});

export const loader: LoaderFunction = recordsLoader;

export const meta: MetaFunction = () => {
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
                <Text style={pdfStyles.recordDuration}>{record.duration ? `${record.duration}분` : ''}</Text>
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          {t("stats_records_page.search_by_period")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 space-y-4" align="end">
        <div className="flex gap-4">
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
        <Button
          onClick={() => onApply(currentStartDate, currentEndDate)}
          className="w-full"
        >
          {t("stats_records_page.apply_period")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default function RecordsPage() {
  const { monthlyRecordsForDisplay, categories, startDate, endDate } = useLoaderData<RecordsLoaderData>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentStartDate = DateTime.fromISO(startDate);
  const currentMonthString = currentStartDate.toFormat('yyyy-MM');

  const handlePeriodSearch = (start: DateTime, end: DateTime) => {
    const newParams = new URLSearchParams();
    newParams.set("startDate", start.toISODate()!);
    newParams.set("endDate", end.toISODate()!);
    navigate(`?${newParams.toString()}`, { preventScrollReset: true });
  }

  const periodControl = (
    <div className="flex items-center gap-1">
      <Button asChild variant="outline" size="icon">
        <Link to={`?month=${currentStartDate.minus({ months: 1 }).toFormat("yyyy-MM")}`} preventScrollReset>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-36">
            {currentStartDate.setLocale(i18n.language).toFormat("yyyy MMMM")}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
           <Calendar
              selectedDate={currentStartDate}
              onDateChange={(day) => day && navigate(`?month=${day.toFormat("yyyy-MM")}`)}
            />
        </PopoverContent>
      </Popover>
      <Button asChild variant="outline" size="icon">
        <Link to={`?month=${currentStartDate.plus({ months: 1 }).toFormat("yyyy-MM")}`} preventScrollReset>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
      <DateRangePicker
        startDate={currentStartDate}
        endDate={DateTime.fromISO(endDate)}
        onApply={handlePeriodSearch}
      />
    </div>
  );

  const isPeriodSearch = searchParams.has("startDate");
  const description = isPeriodSearch
    ? t("stats_records_page.description_period", {
        startDate: currentStartDate.setLocale(i18n.language).toFormat("yyyy.MM.dd"),
        endDate: DateTime.fromISO(endDate).setLocale(i18n.language).toFormat("yyyy.MM.dd"),
      })
    : t("stats_records_page.description_month", {
        month: currentStartDate.setLocale(i18n.language).toFormat("yyyy MMMM"),
      });

  const pdfTitle = isPeriodSearch
    ? t("stats_records_page.pdf_title_period", {
        startDate: currentStartDate.toFormat("yyyy.MM.dd"),
        endDate: DateTime.fromISO(endDate).toFormat("yyyy.MM.dd"),
      })
    : t("stats_records_page.pdf_title_month", {
        month: currentStartDate.toFormat("yyyy MMMM"),
      });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const pdfDocument = (
    <RecordsReportPDF 
      data={monthlyRecordsForDisplay} 
      categories={categories} 
      title={pdfTitle}
    />
  );

  const pdfButton = isClient ? (
    <PDFDownloadLink
      document={pdfDocument}
      fileName={`records-report-${currentMonthString}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {loading ? t("stats_header.pdf.loading") : t("stats_header.pdf.download")}
        </Button>
      )}
    </PDFDownloadLink>
  ) : null;

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="mb-4">
        <StatsPageHeader
          title={t("stats_records_page.title")}
          description={description}
          periodButton={periodControl}
          shareSettings={{ isPublic: false, includeRecords: false, includeDailyNotes: false, includeMemos: false, includeStats: false }}
          onShareSettingsChange={() => {}}
          isShareDialogOpen={false}
          setIsShareDialogOpen={() => {}}
          isCopied={false}
          onCopyLink={() => {}}
          shareLink=""
          pdfButton={pdfButton}
        />
      </div>
      <div className="mt-6">
        <MonthlyRecordsTab 
            monthlyRecordsForDisplay={monthlyRecordsForDisplay}
            categories={categories}
        />
      </div>
    </div>
  );
} 