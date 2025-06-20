import { Dynamic } from "~/common/components/dynamic";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <div className="py-16 md:py-24">
        <section className="container mx-auto px-4 text-center mb-16 md:mb-24">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            매일의 기록이 성장이 되는 곳, Start Beyond
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            하루 10분, 생각을 정리하고 목표를 관리하며 더 나은 나를 만나보세요. Start Beyond는 당신의 꾸준한 성장을 응원하는 가장 쉬운 방법입니다.
          </p>
        </section>

        <Dynamic loader={() => import('~/common/components/home-sections/workflow-section').then(m => ({ default: m.WorkflowSection }))} />
        
        <Dynamic loader={() => import('~/common/components/home-sections/features-section').then(m => ({ default: m.FeaturesSection }))} />

      </div>
    </div>
  );
} 