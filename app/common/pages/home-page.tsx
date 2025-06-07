import { Globe } from "~/common/components/magicui/globe";
import { Marquee } from "~/common/components/magicui/marquee";
import { BentoCard, BentoGrid } from "~/common/components/magicui/bento-grid";

import { Calendar as CalendarIcon, Share2Icon, BarChartIcon, FileTextIcon, GlobeIcon,StarIcon } from "lucide-react";


const files = [
  {
    name: "daily-record.tsx",
    body: "오늘의 활동과 생각을 기록하고, 생산성을 추적하세요.",
  },
  {
    name: "weekly-plan.tsx",
    body: "주간 계획을 세워 중요한 목표에 집중하세요.",
  },
  {
    name: "monthly-review.tsx",
    body: "월간 회고를 통해 성장과정을 돌아보세요.",
  },
  {
    name: "stats.tsx",
    body: "데이터 기반 분석으로 당신의 패턴을 파악하세요.",
  },
  {
    name: "community.tsx",
    body: "다른 사용자들과 목표를 공유하고 동기를 부여받으세요.",
  },
];

const features = [
  {
    Icon: FileTextIcon,
    name: "간편한 기록",
    description: "매일의 활동과 감정을 손쉽게 기록하세요.",
    href: "/daily",
    cta: "기록 시작하기",
    background: <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-purple-50 via-white to-violet-100" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: CalendarIcon,
    name: "체계적인 계획",
    description: "일간, 주간, 월간 계획으로 목표를 관리하세요.",
    href: "/plan",
    cta: "계획 세우기",
    background: <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-indigo-50 via-white to-blue-100" />,
    className: "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BarChartIcon,
    name: "데이터 시각화",
    description: "나의 기록을 한눈에 파악할 수 있는 통계 대시보드.",
    href: "/stats/summary",
    cta: "통계 보기",
    background: <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-green-50 via-white to-emerald-100" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3",
  },
  {
    Icon: Share2Icon,
    name: "커뮤니티",
    description: "다른 사용자들과 경험을 공유하고 소통하세요.",
    href: "/community",
    cta: "커뮤니티 가기",
    background: <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-pink-50 via-white to-red-100" />,
    className: "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3",
  },
    {
    Icon: GlobeIcon,
    name: "글로벌 서비스",
    description: "전 세계 사용자들과 함께 성장하세요.",
    href: "/",
    cta: "더 알아보기",
    background: (
      <Globe className="absolute -right-20 -bottom-10 top-0 h-[400px] w-[400px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] group-hover:scale-105 sm:h-[500px] sm:w-[500px]" />
    ),
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3",
  },
];


const reviews = [
  {
    name: "최고의 생산성 앱",
    body: "이 앱 덕분에 제 하루가 완전히 바뀌었어요. 계획을 세우고 실천하는 게 이렇게 쉬울 줄이야!",
    username: "@ProductivityMaster",
    img: "https://avatar.vercel.sh/alice",
  },
  {
    name: "데이터 분석 기능이 정말 강력해요",
    body: "제 활동 패턴을 시각적으로 볼 수 있어서 너무 좋아요. 어떤 부분에 시간을 더 써야 할지 명확해졌어요.",
    username: "@DataDrivenLife",
    img: "https://avatar.vercel.sh/bob",
  },
  {
    name: "성장하는 나를 발견",
    body: "매일 기록하고 주간, 월간 회고를 하면서 제가 얼마나 성장했는지 알 수 있었어요. 자신감이 생겼습니다!",
    username: "@GrowthSeeker",
    img: "https://avatar.vercel.sh/carol",
  },
   {
    name: "혼자가 아니라는 느낌",
    body: "커뮤니티에서 다른 사람들의 이야기를 보며 많이 배우고 동기부여를 얻어요. 함께 성장하는 느낌!",
    username: "@CommunityLover",
    img: "https://avatar.vercel.sh/dave",
  },
  {
    name: "디자인이 너무 예뻐요",
    body: "매일 쓰고 싶은 앱이에요. UI/UX가 직관적이고 아름다워서 사용할 때마다 기분이 좋아져요.",
    username: "@DesignFan",
    img: "https://avatar.vercel.sh/eve",
  },
   {
    name: "인생 관리의 필수템",
    body: "운동, 공부, 업무, 개인 프로젝트까지... 제 삶의 모든 것을 이 앱 하나로 관리하고 있어요. 최고!",
    username: "@LifeManager",
    img: "https://avatar.vercel.sh/frank",
  },
];

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className="relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4"
      // light-mode
      style={{
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-4">Start Beyond, 당신의 성장을 위한 첫걸음</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            목표 설정, 계획, 실행, 회고까지. Start Beyond는 당신의 꾸준한 성장을 돕는 올인원 생산성 플랫폼입니다.
          </p>
        </section>

        <section className="mb-16">
          <BentoGrid className="lg:grid-rows-2">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-8">사용자들의 찬사</h2>
           <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background py-20">
            <Marquee pauseOnHover className="[--duration:20s]">
              {reviews.map((review) => (
                <ReviewCard key={review.username} {...review} />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
          </div>
        </section>

      </div>
    </div>
  );
} 