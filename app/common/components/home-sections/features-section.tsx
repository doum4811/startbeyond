import { BarChartIcon, GlobeIcon, Share2Icon, UsersIcon } from "lucide-react";
import { BentoCard, BentoGrid } from "~/common/components/magicui/bento-grid";

const otherFeatures = [
    {
      Icon: BarChartIcon,
      name: "한눈에 보는 나의 성장",
      description: "데이터 기반의 통계와 차트로 나의 활동을 분석하고 성장을 시각적으로 확인하세요.",
      href: "/stats/summary",
      cta: "통계 보러가기",
      background: (
        <>
          <img
            alt="Stats"
            src="https://images.pexels.com/photos/669612/pexels-photo-669612.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            className="absolute -z-10 h-full w-full object-cover object-left-top"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ),
      className: "lg:col-span-1",
    },
    {
      Icon: Share2Icon,
      name: "성취를 공유하고 동기부여",
      description: "나의 계획과 성과를 다른 사람들과 공유하고 긍정적인 에너지를 주고받으세요.",
      href: "/stats/summary",
      cta: "공유하기",
      background: (
        <>
          <img
            alt="Sharing"
            src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            className="absolute -z-10 h-full w-full object-cover object-left-top"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ),
      className: "lg:col-span-1",
    },
    {
      Icon: UsersIcon,
      name: "함께 성장하는 커뮤니티",
      description: "비슷한 목표를 가진 사람들과 소통하며 지식과 경험을 나누고 함께 나아가세요.",
      href: "/community",
      cta: "커뮤니티 가기",
      background: (
        <>
          <img
            alt="Community"
            src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            className="absolute -z-10 h-full w-full object-cover object-left-top"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ),
      className: "lg:col-span-1",
    },
];

export function FeaturesSection() {
    return (
        <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold">성장을 가속하는 강력한 기능들</h2>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                    계획과 기록을 넘어, 당신의 성장을 다각도로 지원합니다.
                </p>
            </div>
            <BentoGrid className="lg:grid-cols-3">
            {otherFeatures.map((feature) => (
                <BentoCard key={feature.name} {...feature} />
            ))}
            </BentoGrid>
        </section>
    )
} 