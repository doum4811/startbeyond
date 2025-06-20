import type { Route } from "~/features/users/+types/my-profile-page";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "About | StartBeyond" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return {};
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-3xl py-16 px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            About StartBeyond
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            우리의 미션, 비전, 그리고 왜 이 서비스를 만들게 되었는지 소개합니다.
          </p>
        </header>

        <main className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">우리의 이야기</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              기존의 복잡한 생산성 도구에 지쳐 더 간단하고 직관적인 앱이 필요하다고 생각했습니다. StartBeyond는 거창한 계획도 매일의 작은 실천으로 나눌 수만 있다면 충분히 달성할 수 있다는 믿음에서 시작되었습니다. 복잡함은 덜어내고, 오직 당신의 성장에만 집중할 수 있도록 돕고 싶습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">우리의 목표</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              StartBeyond는 꾸준한 성장을 꿈꾸는 모든 분들이 자신의 목표를 잊지 않고 꾸준히 나아갈 수 있도록 돕는 것을 목표로 합니다. 우리는 사용자가 더 체계적으로 계획하고, 꾸준히 실행하며, 자신의 성장을 한눈에 볼 수 있는 가장 간단하고 강력한 도구를 제공하고자 합니다.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">만든 사람들</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              이 서비스는 개발자 Yong에 의해 만들어졌습니다. 저는 아이디어를 현실로 만들어 사람들에게 작은 변화를 선물하는 일을 사랑합니다. 궁금한 점이 있다면 언제든지{" "}
              <a href="mailto:notivior@gmail.com" className="text-primary hover:underline">notivior@gmail.com</a>
              으로 연락주세요.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
} 