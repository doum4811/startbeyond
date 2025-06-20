import { Globe } from "~/common/components/magicui/globe";
import { Marquee } from "~/common/components/magicui/marquee";
import { BentoCard, BentoGrid } from "~/common/components/magicui/bento-grid";
import { Lens } from "~/common/components/magicui/lens";

import { Calendar as CalendarIcon, Share2Icon, BarChartIcon, FileTextIcon, GlobeIcon, StarIcon, TagIcon, Link2Icon, SparklesIcon, UsersIcon, Settings2Icon, ChevronsRight } from "lucide-react";


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
    description: "언제 어디서든 떠오르는 생각과 오늘의 할 일을 간편하게 기록하세요. 쓰기만 하면 자동으로 정리됩니다.",
    href: "/",
    cta: "",
    background: <img alt="노트에 글을 작성하는 사람" src="https://images.pexels.com/photos/711009/pexels-photo-711009.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="absolute -z-10 h-full w-full object-cover object-left-top" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: CalendarIcon,
    name: "체계적인 계획",
    description: "일간, 주간, 월간 계획으로 큰 목표를 작은 실천으로 나누고, 꾸준히 나아가세요.",
    href: "/",
    cta: "",
    background: <img alt="플래너가 놓인 책상" src="https://images.pexels.com/photos/5717430/pexels-photo-5717430.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="absolute -z-10 h-full w-full object-cover object-left-top" />,
    className: "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BarChartIcon,
    name: "데이터 시각화",
    description: "나의 기록과 성과를 차트와 그래프로 한눈에 확인하세요. 어떤 길을 걸어왔는지, 어디로 가야 할지 명확해집니다.",
    href: "/",
    cta: "",
    background: <img alt="분석 그래프가 보이는 화면" src="https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="absolute -z-10 h-full w-full object-cover object-left-top" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3",
  },
  {
    Icon: Share2Icon,
    name: "커뮤니티",
    description: "비슷한 목표를 가진 사람들과 경험을 나누고 서로에게 동기부여가 되어주세요. 함께하면 더 멀리 갈 수 있어요.",
    href: "/",
    cta: "",
    background: <img alt="Community" src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="absolute -z-10 h-full w-full object-cover object-left-top" />,
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

const finalFeatures = [
    {
        Icon: UsersIcon,
        name: "커뮤니티",
        description: "같은 목표를 가진 사람들과 함께 성장하세요.",
        href: "/community",
        cta: "자세히 보기",
        background: <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50" />,
        className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
    },
    {
        Icon: Settings2Icon,
        name: "자유로운 맞춤 설정",
        description: "나만의 카테고리, 목표, 태그로 당신에게 꼭 맞는 시스템을 만드세요.",
        href: "/settings",
        cta: "자세히 보기",
        background: <div className="absolute -z-10 h-full w-full bg-gradient-to-br from-green-50 to-cyan-100 dark:from-green-900/50 dark:to-cyan-900/50" />,
        className: "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
    },
    {
        Icon: GlobeIcon,
        name: "글로벌 커뮤니티",
        description: "전 세계 사용자들과 영감을 주고받으며 함께 성장하세요.",
        href: "/",
        cta: "자세히 보기",
        background: (
            <Globe className="absolute -right-20 -bottom-10 top-0 h-[400px] w-[400px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] group-hover:scale-105 sm:h-[500px] sm:w-[500px]" />
        ),
        className: "lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:row-end-3",
    },
];

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

      </div>
    </div>
  );
} 