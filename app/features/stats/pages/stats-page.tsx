// // ⚠️ 이 파일은 더 이상 직접 사용하지 않습니다. summary-page.tsx, category-page.tsx, advanced-page.tsx로 분리됨.
// // 기존 StatsPage 로직은 참고용으로만 남겨둡니다.
// // 실제 라우트 엔트리에서는 summary/category/advanced를 사용하세요.

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
// import { Button } from "~/common/components/ui/button";
// import { Input } from "~/common/components/ui/input";
// import { Calendar as CalendarIcon, Search, BarChart2, Calendar, List, FileText, Share2, Copy, Check, ChevronDown, ChevronUp, Filter, Grid, Download, ChevronLeft, ChevronRight } from "lucide-react";
// import { DateTime } from "luxon";
// import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
// import { TimeAnalysisChart } from "~/common/components/stats/time-analysis-chart";
// import { ActivityHeatmap } from "~/common/components/stats/activity-heatmap";
// import type { CategoryCode, UICategory } from "~/common/types/daily";
// import { CATEGORIES } from "~/common/types/daily";
// import { Switch } from "~/common/components/ui/switch";
// import { Label } from "~/common/components/ui/label";
// import { Checkbox } from "~/common/components/ui/checkbox";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/common/components/ui/dialog";
// import { toast } from "sonner";
// import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
// import { Badge } from "~/common/components/ui/badge";
// import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
// import type { LoaderFunctionArgs, MetaFunction } from "react-router";
// import { useFetcher, Link, Form } from "react-router";
// import * as dailyQueries from "~/features/daily/queries";
// // import type { DailyRecordUI, DailyNoteUI, MemoUI } from "~/features/daily/pages/daily-page";
// import * as settingsQueries from "~/features/settings/queries";
// import { MonthlyRecordsDisplayTab } from "~/features/stats/components/monthly-records-display-tab";

// // Helper to get profileId (consistent with other pages)
// async function getProfileId(_request?: Request): Promise<string> {
//   return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a"; // Replace with actual auth logic later
// }

// // Interface for data structure for one day in monthly records
// interface MonthlyDayRecord {
//   date: string; // YYYY-MM-DD
//   records: DailyRecordUI[];
//   dailyNote: string | null; // Assuming one aggregated note string per day for simplicity here
//   memos: MemoUI[]; // All memos from all records of that day
// }

// export interface StatsPageLoaderData {
//   profileId: string;
//   selectedMonthISO: string; // YYYY-MM (e.g., "2024-03")
//   monthlyRecordsForDisplay: MonthlyDayRecord[];
//   categories: UICategory[];
//   // Add other necessary data for summary later
// }

// export const loader = async ({ request }: LoaderFunctionArgs): Promise<StatsPageLoaderData> => {
//   const profileId = await getProfileId(request);
//   const url = new URL(request.url);
//   const monthParam = url.searchParams.get("month") || DateTime.now().toFormat("yyyy-MM");
//   const selectedMonthStart = DateTime.fromFormat(monthParam, "yyyy-MM").startOf("month");
//   const selectedMonthEnd = selectedMonthStart.endOf("month");

//   const [dbRecords, dbNotes, userCategoriesData, userDefaultCodePreferencesData] = await Promise.all([
//     dailyQueries.getDailyRecordsByPeriod({
//       profileId,
//       startDate: selectedMonthStart.toISODate()!,
//       endDate: selectedMonthEnd.toISODate()!,
//     }),
//     // Assuming getDailyNotesByPeriod exists or fetching notes for each day
//     // For now, let's fetch all notes in the period and then group them.
//     dailyQueries.getDailyNotesByPeriod({ // Placeholder - this function needs to be created
//       profileId,
//       startDate: selectedMonthStart.toISODate()!,
//       endDate: selectedMonthEnd.toISODate()!,
//     }),
//     settingsQueries.getUserCategories({ profileId }),
//     settingsQueries.getUserDefaultCodePreferences({ profileId })
//   ]);

//   const records: DailyRecordUI[] = (dbRecords || []).map((r: dailyQueries.DailyRecord): DailyRecordUI => ({
//     ...r,
//     id: r.id!,
//     date: r.date, 
//     duration: r.duration_minutes ?? undefined,
//     is_public: r.is_public ?? false,
//     comment: r.comment ?? null,
//     subcode: r.subcode ?? null,
//     linked_plan_id: r.linked_plan_id ?? null,
//     category_code: r.category_code,
//     memos: [], // Initialize memos, will be populated later if needed for this view
//   }));

//   const recordIds = records.map(r => r.id).filter((id): id is string => typeof id === 'string');
//   const dbMemos: dailyQueries.Memo[] = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds({ profileId, recordIds }) : [];
//   const memos: MemoUI[] = (dbMemos || []).map((m: dailyQueries.Memo): MemoUI => ({ 
//     ...m, 
//     id: m.id!, 
//     record_id: m.record_id // Ensure record_id is present
//   }));

//   // Group notes by date
//   const notesByDate = new Map<string, string[]>();
//   (dbNotes || []).forEach((note: dailyQueries.DailyNote) => {
//     const dateKey = note.date; // Assuming note.date is YYYY-MM-DD
//     if (!notesByDate.has(dateKey)) {
//       notesByDate.set(dateKey, []);
//     }
//     notesByDate.get(dateKey)!.push(note.content);
//   });

//   // Combine records, notes, and memos by day
//   const monthlyRecordsForDisplay: MonthlyDayRecord[] = [];
//   for (let day = selectedMonthStart; day <= selectedMonthEnd; day = day.plus({ days: 1 })) {
//     const dateStr = day.toISODate()!;
//     const dayRecords = records.filter(r => r.date === dateStr);
//     const dayNotesContent = notesByDate.get(dateStr)?.join("\n\n") || null;
//     const dayRecordIds = dayRecords.map(r => r.id);
//     const dayMemos = memos.filter(m => dayRecordIds.includes(m.record_id));

//     // Only add day if there are records or notes
//     if (dayRecords.length > 0 || dayNotesContent) {
//          monthlyRecordsForDisplay.push({
//             date: dateStr,
//             records: dayRecords,
//             dailyNote: dayNotesContent,
//             memos: dayMemos,
//         });
//     }
//   }
//   monthlyRecordsForDisplay.sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

//   // Process categories (similar to other pages)
//   const processedCategories: UICategory[] = [];
//   const defaultCategoryPreferences = new Map(
//     (userDefaultCodePreferencesData || []).map((pref: settingsQueries.UserDefaultCodePreference): [string, boolean] => 
//       [pref.default_category_code, pref.is_active as boolean]
//     )
//   );
//   for (const catCodeKey in CATEGORIES) {
//     if (Object.prototype.hasOwnProperty.call(CATEGORIES, catCodeKey)) {
//       const baseCategory = CATEGORIES[catCodeKey as CategoryCode];
//       const isActivePreference = defaultCategoryPreferences.get(baseCategory.code);
//       // Ensure isActive is explicitly boolean. Default to true if undefined.
//       const isActive = typeof isActivePreference === 'boolean' ? isActivePreference : true;
//       processedCategories.push({ ...baseCategory, isCustom: false, isActive: isActive, sort_order: baseCategory.sort_order || 999 });
//     }
//   }
//   (userCategoriesData || []).forEach((userCat: settingsQueries.UserCategory) => {
//     const existingIndex = processedCategories.findIndex(c => c.code === userCat.code && !c.isCustom);
//     if (existingIndex !== -1) {
//         if(userCat.is_active) processedCategories.splice(existingIndex, 1);
//         else return;
//     }
//     if (!processedCategories.find(c => c.code === userCat.code && c.isCustom)) {
//         processedCategories.push({
//             code: userCat.code, label: userCat.label, icon: userCat.icon || '📝',
//             color: userCat.color || undefined, isCustom: true, isActive: userCat.is_active,
//             hasDuration: true, sort_order: userCat.sort_order !== null && userCat.sort_order !== undefined ? userCat.sort_order : 1000,
//         });
//     }
//   });
//   processedCategories.sort((a, b) => {
//     if (a.isActive && !b.isActive) return -1;
//     if (!a.isActive && b.isActive) return 1;
//     if (a.isCustom && !b.isCustom) return -1;
//     if (!a.isCustom && b.isCustom) return 1;
//     return (a.sort_order ?? 999) - (b.sort_order ?? 999);
//   });

//   return {
//     profileId,
//     selectedMonthISO: monthParam,
//     monthlyRecordsForDisplay,
//     categories: processedCategories,
//   };
// };

// export const meta: MetaFunction<typeof loader> = ({ data }) => {
//   const pageData = data as StatsPageLoaderData | undefined;
//   const monthName = pageData?.selectedMonthISO ? DateTime.fromFormat(pageData.selectedMonthISO, "yyyy-MM").toFormat("MMMM yyyy") : "Stats";
//   return [
//     { title: `${monthName} Statistics - StartBeyond` },
//     { name: "description", content: `View your activity statistics for ${monthName}.` },
//   ];
// };

// // Mock data
// const mockCategoryData = [
//   { category: "EX" as CategoryCode, count: 30, duration: 45, percentage: 35 },
//   { category: "BK" as CategoryCode, count: 20, duration: 30, percentage: 25 },
//   { category: "ML" as CategoryCode, count: 15, duration: 20, percentage: 20 },
//   { category: "EM" as CategoryCode, count: 10, duration: 15, percentage: 15 },
//   { category: "ST" as CategoryCode, count: 5, duration: 10, percentage: 5 },
// ];

// const mockTimeData = [
//   {
//     date: "2024-03-01",
//     categories: {
//       EX: 2,
//       BK: 1,
//       ML: 1,
//       EM: 0,
//       ST: 0,
//       WK: 0,
//       HB: 0,
//       SL: 0,
//       RT: 0,
//     },
//     total: 4,
//   },
//   {
//     date: "2024-03-02",
//     categories: {
//       EX: 1,
//       BK: 2,
//       ML: 0,
//       EM: 1,
//       ST: 0,
//       WK: 0,
//       HB: 0,
//       SL: 0,
//       RT: 0,
//     },
//     total: 4,
//   },
// ];

// const mockHeatmapData = [
//   {
//     date: "2024-03-01",
//     intensity: 0.8,
//     categories: {
//       EX: 2,
//       BK: 1,
//       ML: 1,
//       EM: 0,
//       ST: 0,
//       WK: 0,
//       HB: 0,
//       SL: 0,
//       RT: 0,
//     },
//   },
//   {
//     date: "2024-03-02",
//     intensity: 0.6,
//     categories: {
//       EX: 1,
//       BK: 2,
//       ML: 0,
//       EM: 1,
//       ST: 0,
//       WK: 0,
//       HB: 0,
//       SL: 0,
//       RT: 0,
//     },
//   },
//   {
//     date: "2024-03-03",
//     intensity: 0.4,
//     categories: {
//       EX: 0,
//       BK: 0,
//       ML: 0,
//       EM: 0,
//       ST: 0,
//       WK: 0,
//       HB: 0,
//       SL: 0,
//       RT: 0,
//     },
//   },
//   {
//     date: "2024-03-04",
//     intensity: 0.2,
//     categories: {
//       EX: 0,
//       BK: 0,
//       ML: 0,
//       EM: 0,
//       ST: 0,
//       WK: 0,
//       HB: 0,
//       SL: 0,
//       RT: 0,
//     },
//   },
// ];

// // Mock monthly records data
// const mockMonthlyRecords = [
//   {
//     date: "2024-03-01",
//     records: [
//       {
//         id: "1",
//         category_code: "EX" as CategoryCode,
//         duration: 30,
//         comment: "러닝",
//         subcode: "Running",
//         created_at: "2024-03-01T08:00:00Z",
//       },
//       {
//         id: "2",
//         category_code: "BK" as CategoryCode,
//         duration: 60,
//         comment: "독서",
//         subcode: "Reading",
//         created_at: "2024-03-01T20:00:00Z",
//       }
//     ],
//     dailyNote: "오늘은 좋은 하루였다. 아침에 러닝을 하고 저녁에 독서를 했다.",
//     memos: [
//       {
//         id: "1",
//         title: "러닝 기록",
//         content: "오늘은 5km를 달렸다. 페이스가 좋았다.",
//         created_at: "2024-03-01T08:30:00Z"
//       }
//     ]
//   },
//   {
//     date: "2024-03-02",
//     records: [
//       {
//         id: "3",
//         category_code: "ML" as CategoryCode,
//         duration: 45,
//         comment: "명상",
//         subcode: "Meditation",
//         created_at: "2024-03-02T07:00:00Z",
//       }
//     ],
//     dailyNote: "아침에 명상을 했다. 마음이 평화로웠다.",
//     memos: []
//   }
// ];

// // Mock yearly heatmap data
// const mockYearlyHeatmapData = Array.from({ length: 365 }, (_, i) => {
//   const date = DateTime.now().minus({ days: i });
//   return {
//     date: date.toFormat("yyyy-MM-dd"),
//     intensity: Math.random(),
//     categories: {
//       EX: Math.floor(Math.random() * 3),
//       BK: Math.floor(Math.random() * 3),
//       ML: Math.floor(Math.random() * 3),
//       EM: Math.floor(Math.random() * 3),
//       ST: Math.floor(Math.random() * 3),
//       WK: Math.floor(Math.random() * 3),
//       HB: Math.floor(Math.random() * 3),
//       SL: Math.floor(Math.random() * 3),
//       RT: Math.floor(Math.random() * 3),
//     },
//   };
// });

// interface ShareSettings {
//   isPublic: boolean;
//   includeRecords: boolean;
//   includeDailyNotes: boolean;
//   includeMemos: boolean;
//   includeStats: boolean;
// }

// const initialShareSettings: ShareSettings = {
//   isPublic: false,
//   includeRecords: true,
//   includeDailyNotes: true,
//   includeMemos: false,
//   includeStats: true,
// };

// // PDF Document Component
// const MonthlyReportPDF = ({ data, categories }: { data: MonthlyDayRecord[], categories: UICategory[] }) => (
//   <Document>
//     <Page size="A4" style={styles.page}>
//       <View style={styles.header}>
//         <Text style={styles.title}>월간 활동 보고서</Text>
//         <Text style={styles.date}>{DateTime.now().toFormat("yyyy년 MM월")}</Text>
//       </View>
      
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>활동 요약</Text>
//         <View style={styles.summary}>
//           <Text>총 기록 수: {data.reduce((sum, day) => sum + day.records.length, 0)}개</Text>
//           <Text>활동 일수: {data.length}일</Text>
//         </View>
//       </View>

//       {data.map((day) => (
//         <View key={day.date} style={styles.daySection}>
//           <Text style={styles.dayTitle}>{day.date}</Text>
//           {day.records.map((record) => {
//             const categoryInfo = categories.find(c => c.code === record.category_code);
//             return (
//             <View key={record.id} style={styles.record}>
//               <Text style={styles.recordTitle}>
//                 {categoryInfo?.label || record.category_code}
//                 {record.subcode && ` - ${record.subcode}`}
//               </Text>
//               <Text style={styles.recordDetail}>
//                 {record.duration && `${record.duration}분 • `}
//                 {record.comment}
//               </Text>
//             </View>
//             );
//           })}
//           {day.dailyNote && (
//             <View style={styles.note}>
//               <Text style={styles.noteTitle}>일일 메모</Text>
//               <Text style={styles.noteContent}>{day.dailyNote}</Text>
//             </View>
//           )}
//         </View>
//       ))}
//     </Page>
//   </Document>
// );

// // PDF Styles
// const styles = StyleSheet.create({
//   page: {
//     padding: 30,
//     fontFamily: "Helvetica",
//   },
//   header: {
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 24,
//     marginBottom: 10,
//   },
//   date: {
//     fontSize: 14,
//     color: "#666",
//   },
//   section: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   summary: {
//     marginBottom: 10,
//   },
//   daySection: {
//     marginBottom: 15,
//     borderBottom: "1 solid #eee",
//     paddingBottom: 10,
//   },
//   dayTitle: {
//     fontSize: 16,
//     marginBottom: 5,
//   },
//   record: {
//     marginBottom: 5,
//   },
//   recordTitle: {
//     fontSize: 12,
//     marginBottom: 2,
//   },
//   recordDetail: {
//     fontSize: 10,
//     color: "#666",
//   },
//   note: {
//     marginTop: 5,
//   },
//   noteTitle: {
//     fontSize: 12,
//     marginBottom: 2,
//   },
//   noteContent: {
//     fontSize: 10,
//     color: "#666",
//   },
// });

// interface StatsPageProps {
//   loaderData: StatsPageLoaderData;
// }

// export default function StatsPage({ loaderData }: StatsPageProps) {
//   const { selectedMonthISO, monthlyRecordsForDisplay, categories, profileId } = loaderData;

//   const [dateRange, setDateRange] = useState(() => {
//     const monthStart = DateTime.fromFormat(selectedMonthISO, "yyyy-MM").startOf("month");
//     return {
//       start: monthStart,
//       end: monthStart.endOf("month"),
//     };
//   });
//   const [heatmapMode, setHeatmapMode] = useState<"monthly" | "yearly">("monthly");

//   const [shareSettings, setShareSettings] = useState<ShareSettings>(initialShareSettings);
//   const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
//   const [isCopied, setIsCopied] = useState(false);

//   useEffect(() => {
//     const monthStart = DateTime.fromFormat(selectedMonthISO, "yyyy-MM").startOf("month");
//     setDateRange({
//       start: monthStart,
//       end: monthStart.endOf("month"),
//     });
//   }, [selectedMonthISO]);

//   function handleShareSettingsChange(key: keyof ShareSettings, value: boolean) {
//     setShareSettings(prev => ({ ...prev, [key]: value }));
//   }

//   function handleCopyLink() {
//     const mockShareLink = "https://startbeyond.com/share/monthly/abc123";
//     navigator.clipboard.writeText(mockShareLink);
//     setIsCopied(true);
//     toast.success("링크가 복사되었습니다");
//     setTimeout(() => setIsCopied(false), 2000);
//   }

//   const currentMonth = DateTime.fromFormat(selectedMonthISO, "yyyy-MM");
//   const prevMonthISO = currentMonth.minus({ months: 1 }).toFormat("yyyy-MM");
//   const nextMonthISO = currentMonth.plus({ months: 1 }).toFormat("yyyy-MM");

//   const pdfDocument = <MonthlyReportPDF data={monthlyRecordsForDisplay} categories={categories} />;

//   return (
//     <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold">통계</h1>
//         <div className="flex items-center gap-2">
//           <Button asChild variant="outline" size="icon">
//             <Link to={`?month=${prevMonthISO}`} preventScrollReset>
//               <ChevronLeft className="h-4 w-4" />
//             </Link>
//           </Button>
//           <span className="text-lg font-medium">
//             {currentMonth.toFormat("yyyy년 MMMM")}
//           </span>
//           <Button asChild variant="outline" size="icon">
//             <Link to={`?month=${nextMonthISO}`} preventScrollReset>
//               <ChevronRight className="h-4 w-4" />
//             </Link>
//           </Button>
//           <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
//             <DialogTrigger asChild>
//               <Button variant="outline" size="sm">
//                 <Share2 className="w-4 h-4 mr-2" />
//                 공유하기
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>월간 요약 공유 설정</DialogTitle>
//               </DialogHeader>
//               <div className="space-y-4 py-4">
//                 <div className="flex items-center justify-between">
//                   <Label htmlFor="public">공개 설정</Label>
//                   <Switch
//                     id="public"
//                     checked={shareSettings.isPublic}
//                     onCheckedChange={(checked) => handleShareSettingsChange("isPublic", checked)}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <div className="text-sm font-medium mb-2">공유할 정보 선택</div>
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="records"
//                       checked={shareSettings.includeRecords}
//                       onCheckedChange={(checked) => handleShareSettingsChange("includeRecords", checked as boolean)}
//                     />
//                     <Label htmlFor="records">활동 기록</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="dailyNotes"
//                       checked={shareSettings.includeDailyNotes}
//                       onCheckedChange={(checked) => handleShareSettingsChange("includeDailyNotes", checked as boolean)}
//                     />
//                     <Label htmlFor="dailyNotes">일일 메모</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="memos"
//                       checked={shareSettings.includeMemos}
//                       onCheckedChange={(checked) => handleShareSettingsChange("includeMemos", checked as boolean)}
//                     />
//                     <Label htmlFor="memos">상세 메모</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="stats"
//                       checked={shareSettings.includeStats}
//                       onCheckedChange={(checked) => handleShareSettingsChange("includeStats", checked as boolean)}
//                     />
//                     <Label htmlFor="stats">통계</Label>
//                   </div>
//                 </div>
//                 {shareSettings.isPublic && (
//                   <div className="space-y-2">
//                     <div className="text-sm font-medium">공유 링크</div>
//                     <div className="flex gap-2">
//                       <Input
//                         value="https://startbeyond.com/share/monthly/abc123"
//                         readOnly
//                         className="flex-1"
//                       />
//                       <Button
//                         variant="outline"
//                         size="icon"
//                         onClick={handleCopyLink}
//                       >
//                         {isCopied ? (
//                           <Check className="w-4 h-4 text-green-500" />
//                         ) : (
//                           <Copy className="w-4 h-4" />
//                         )}
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>
//           <PDFDownloadLink
//             document={pdfDocument}
//             fileName={`monthly-report-${selectedMonthISO}.pdf`}
//           >
//             {({ loading }) => (
//               <Button variant="outline" size="sm" disabled={loading}>
//                 <Download className="w-4 h-4 mr-2" />
//                 {loading ? "PDF 생성 중..." : "PDF 다운로드"}
//               </Button>
//             )}
//           </PDFDownloadLink>
//         </div>
//       </div>

//       <Tabs defaultValue="summary" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="summary">
//             <BarChart2 className="w-4 h-4 mr-2" />
//             월간 요약
//           </TabsTrigger>
//           <TabsTrigger value="time-analysis">
//             <Calendar className="w-4 h-4 mr-2" />
//             시간 분석
//           </TabsTrigger>
//           <TabsTrigger value="search">
//             <Search className="w-4 h-4 mr-2" />
//             기록 검색
//           </TabsTrigger>
//           <TabsTrigger value="heatmap">
//             <Calendar className="w-4 h-4 mr-2" />
//             히트맵
//           </TabsTrigger>
//           <TabsTrigger value="monthly-records">
//             <FileText className="w-4 h-4 mr-2" />
//             월간 기록
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="summary" className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">총 기록 수</CardTitle>
//                 <BarChart2 className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">1,234</div>
//                 <p className="text-xs text-muted-foreground">+20.1% from last month</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">총 활동 시간</CardTitle>
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">234시간</div>
//                 <p className="text-xs text-muted-foreground">+12.3% from last month</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">목표 달성률</CardTitle>
//                 <List className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">85%</div>
//                 <p className="text-xs text-muted-foreground">+5% from last month</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">가장 많은 활동</CardTitle>
//                 <BarChart2 className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">운동</div>
//                 <p className="text-xs text-muted-foreground">전체의 35%</p>
//               </CardContent>
//             </Card>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <CategoryDistributionChart data={mockCategoryData} />
//             <Card>
//               <CardHeader>
//                 <CardTitle>세부코드별 분포</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
//                   바 차트가 들어갈 자리
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>월간 메모 요약</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="text-sm text-muted-foreground">
//                   이번 달 가장 많이 언급된 키워드: 운동, 독서, 명상
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   주요 성취: 러닝 100km 달성, 독서 5권 완료
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="time-analysis" className="space-y-4">
//           <TimeAnalysisChart data={mockTimeData} />
//         </TabsContent>

//         <TabsContent value="search" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>기록 검색</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="flex gap-4">
//                   <Input placeholder="키워드 검색" className="flex-1" />
//                   <Button variant="outline">
//                     <Search className="w-4 h-4 mr-2" />
//                     검색
//                   </Button>
//                 </div>
//                 <div className="rounded border p-4 text-muted-foreground">
//                   검색 결과가 여기에 표시됩니다
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="heatmap" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <CardTitle>활동 히트맵</CardTitle>
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant={heatmapMode === "monthly" ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setHeatmapMode("monthly")}
//                   >
//                     월간
//                   </Button>
//                   <Button
//                     variant={heatmapMode === "yearly" ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setHeatmapMode("yearly")}
//                   >
//                     연간
//                   </Button>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {heatmapMode === "monthly" ? (
//                 <ActivityHeatmap
//                   data={mockHeatmapData}
//                   startDate={dateRange.start}
//                   endDate={dateRange.end}
//                 />
//               ) : (
//                 <ActivityHeatmap
//                   data={mockYearlyHeatmapData}
//                   startDate={DateTime.now().minus({ days: 365 })}
//                   endDate={DateTime.now()}
//                 />
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="monthly-records" className="space-y-4">
//           <MonthlyRecordsDisplayTab 
//             monthlyRecordsForDisplay={monthlyRecordsForDisplay}
//             categories={categories}
//           />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// } 

import type pkg from '@supabase/supabase-js';
type SupabaseClient = typeof pkg.SupabaseClient; 