import type { Route } from "./+types/announcements-page.ts";

export const loader = () => {
    // 향후 데이터베이스에서 공지사항을 가져올 수 있습니다.
    const announcements: { id: number; title: string; date: string; content: string }[] = []; 
    return { announcements };
}

export const meta: Route.MetaFunction = () => {
  return [{ title: "공지사항 | StartBeyond" }];
};

export default function AnnouncementsPage({ loaderData }: Route.ComponentProps) {
    const { announcements } = loaderData;

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold tracking-tight">공지사항</h1>
                <p className="mt-2 text-muted-foreground">StartBeyond의 최신 소식을 확인하세요.</p>
            </header>
            <main>
                {announcements.length > 0 ? (
                    <ul className="space-y-6">
                        {announcements.map((item: { id: number; title: string; date: string; content: string }) => (
                            <li key={item.id} className="p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground">{item.date}</p>
                                <h2 className="text-xl font-semibold mt-1">{item.title}</h2>
                                <p className="mt-2 text-muted-foreground">{item.content}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-20 border rounded-lg bg-gray-50 dark:bg-gray-800/20">
                        <p className="text-lg text-muted-foreground">새로운 공지사항이 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
} 