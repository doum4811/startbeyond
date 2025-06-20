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
    <div className="container mx-auto max-w-screen-md py-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            About StartBeyond
          </h1>
          <p className="text-lg text-muted-foreground">
            우리의 미션, 비전, 그리고 왜 이 서비스를 만들게 되었는지 소개하는
            공간입니다.
          </p>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>우리의 이야기</h2>
          <p>
            (이곳에 서비스를 시작하게 된 계기나 스토리를 자유롭게
            작성해주세요. 예를 들어, '기존의 복잡한 도구에 지쳐 더 간단하고
            직관적인 생산성 앱이 필요하다고 생각했습니다.' 와 같이 진솔한 이야기는
            사용자에게 더 큰 공감을 얻을 수 있습니다.)
          </p>
          <h2>우리의 목표</h2>
          <p>
            StartBeyond는 (어떤 사용자)가 (어떤 목표)를 달성할 수 있도록 돕는
            것을 목표로 합니다. 우리는 사용자가 더 체계적으로 계획하고, 꾸준히
            실행하며, 자신의 성장을 한눈에 볼 수 있는 최고의 도구를 제공하고자
            합니다.
          </p>
          <h2>만든 사람들</h2>
          <p>
            이 서비스는 (당신의 이름이나 닉네임)에 의해 만들어졌습니다. 저는 (당신을
            소개하는 간단한 문장)입니다. 궁금한 점이 있다면 언제든지{" "}
            <a href="mailto:notivior@gmail.com">notivior@gmail.com</a>
            으로 연락주세요.
          </p>
        </div>
      </div>
    </div>
  );
} 