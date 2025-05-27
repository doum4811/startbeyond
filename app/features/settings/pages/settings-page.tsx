// import { AppSidebar } from "../common/components/app-sidebar";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* <AppSidebar active="settings" /> */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">코드(카테고리/subcode) 관리</h2>
          <div className="rounded border p-4 text-muted-foreground">여기에 코드(카테고리/subcode) 관리 UI가 들어갑니다.</div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">내 코드 자동완성/추천 관리</h2>
          <div className="rounded border p-4 text-muted-foreground">여기에 내 코드 자동완성/추천 관리 UI가 들어갑니다.</div>
        </div>
      </main>
    </div>
  );
} 