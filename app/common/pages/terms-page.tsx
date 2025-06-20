import type { Route } from "~/features/users/+types/my-profile-page";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Terms of Service | StartBeyond" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return {};
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-screen-md py-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">
            최종 업데이트: {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            StartBeyond 서비스에 오신 것을 환영합니다. 본 약관은 StartBeyond(이하
            '서비스')와 사용자 간의 권리, 의무 및 책임사항을 규정하는 것을
            목적으로 합니다.
          </p>

          <h2>1. 서비스의 제공 및 변경</h2>
          <p>
            (이곳에는 제공하는 서비스의 주요 내용과, 서비스가 변경되거나 중단될
            수 있다는 점을 명시합니다. 예: '우리 서비스는 사용자의 목표 관리를
            돕는 웹 애플리케이션이며, 기능은 사전 공지 후 추가되거나 변경될 수
            있습니다.')
          </p>

          <h2>2. 사용자 계정</h2>
          <p>
            (이곳에는 계정 생성, 정보의 정확성, 계정 보안 책임에 대한 내용을
            작성합니다. 예: '서비스를 이용하기 위해 가입할 때 정확한 정보를
            제공해야 하며, 계정의 비밀번호 등 보안 유지의 책임은 사용자 본인에게
            있습니다.')
          </p>

          <h2>3. 금지 행위</h2>
          <p>
            (사용자가 해서는 안 되는 행동을 명시합니다. 예: '타인의 계정 도용,
            악성 코드 유포, 서비스의 정상적인 운영을 방해하는 행위는 금지됩니다.')
          </p>

          <h2>4. 책임의 제한</h2>
          <p>
            (서비스가 보증하지 않는 내용과 책임의 한계를 설명합니다. 베타
            서비스의 경우 데이터 유실 가능성 등을 언급할 수 있습니다. 예: '베타
            서비스 기간 동안 예기치 않은 오류나 데이터 손실이 발생할 수 있으며,
            서비스는 이로 인한 손해에 대해 책임을 지지 않습니다.')
          </p>

          <p>
            더 자세한 내용은{" "}
            <a href="mailto:notivior@gmail.com">
              notivior@gmail.com
            </a>
            으로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
} 