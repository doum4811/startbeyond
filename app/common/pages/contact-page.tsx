import { Mail } from "lucide-react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "문의하기 | StartBeyond" }];
};

export default function ContactPage() {
    return (
        <div className="container mx-auto max-w-2xl py-16 px-4">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight">문의하기</h1>
                <p className="mt-2 text-muted-foreground">
                    궁금한 점이나 좋은 제안이 있으시면 언제든지 연락주세요.
                </p>
            </header>
            <main className="flex justify-center">
                <a
                    href="mailto:notivior@gmail.com"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    <Mail className="h-5 w-5" />
                    notivior@gmail.com
                </a>
            </main>
        </div>
    );
} 