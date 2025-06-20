import { Lens } from "~/common/components/magicui/lens";

function WorkflowStep({
  step,
  title,
  description,
  imageUrl,
  isReversed = false,
}: {
  step: string;
  title: string;
  description: string;
  imageUrl: string;
  isReversed?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-8 md:gap-12 ${
        isReversed ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="flex-1 text-center md:text-left">
        <div className="mb-4">
          <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-semibold">
            STEP {step}
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-3">{title}</h3>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      <div className="w-full flex-1">
        <Lens className="rounded-lg shadow-xl overflow-hidden border">
          <img src={imageUrl} alt={title} className="w-full h-auto" />
        </Lens>
      </div>
    </div>
  );
}

export function WorkflowSection() {
    return (
        <section className="container mx-auto px-4">
          <div className="relative space-y-16 md:space-y-24">
            {/* Vertical connector for desktop */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />

            <WorkflowStep
              step="01"
              title="월간 목표로 큰 그림을 그리세요"
              description="한 달 동안 달성하고 싶은 가장 중요한 목표를 세워보세요. 당신의 성장을 위한 방향키가 되어줄 거예요."
              imageUrl="/screenshots/monthly.png"
            />
            <WorkflowStep
              step="02"
              title="주간 계획으로 목표를 현실로"
              description="월간 목표를 달성하기 위한 주차별 액션 플랜을 만드세요. 막막했던 목표가 구체적인 할 일로 바뀝니다."
              imageUrl="/screenshots/weekly.png"
              isReversed={true}
            />
            <WorkflowStep
              step="03"
              title="내일 계획으로 하루를 미리 준비"
              description="주간 계획을 바탕으로 내일 할 일을 미리 정리해보세요. 계획적인 하루는 더 높은 성취감으로 이어집니다."
              imageUrl="/screenshots/tomorrow.png"
            />
            <WorkflowStep
              step="04"
              title="일일 기록으로 성장을 위한 발걸음"
              description="오늘 계획한 일을 실행하고, 그 과정을 간단히 기록하세요. 작은 실천이 모여 큰 변화를 만듭니다."
              imageUrl="/screenshots/daily.png"
              isReversed={true}
            />
          </div>
        </section>
    )
} 