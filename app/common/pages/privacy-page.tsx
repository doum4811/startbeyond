import type { Route } from "~/features/users/+types/my-profile-page";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Privacy Policy | StartBeyond" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return {};
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-screen-md py-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">
            최종 업데이트: {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            StartBeyond는 사용자의 개인정보를 소중하게 생각하며, 개인정보보호법을
            준수하고 있습니다. 본 처리방침은 당사가 어떤 정보를 수집하고, 어떻게
            사용하며, 안전하게 관리하는지에 대해 설명합니다.
          </p>

          <h2>1. 수집하는 개인정보</h2>
          <p>
            (이곳에는 수집하는 정보의 종류를 명시합니다. 예: '회원가입 시 이메일
            주소, 이름(또는 닉네임), 비밀번호를 수집합니다. 소셜 로그인을 이용할
            경우, 해당 소셜 서비스로부터 프로필 정보(이름, 프로필 사진 등)를
            제공받을 수 있습니다.')
          </p>

          <h2>2. 개인정보의 수집 및 이용 목적</h2>
          <p>
            (수집한 정보를 사용하는 목적을 설명합니다. 예: '수집된 정보는 회원
            식별, 서비스 이용 계약 이행, 공지사항 전달, 문의 응대, 서비스 개선을
            위한 통계 분석에 사용됩니다.')
          </p>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            (정보를 언제까지 보관할지 명시합니다. 예: '수집된 개인정보는 사용자가
            회원 자격을 유지하는 동안 보유 및 이용되며, 회원 탈퇴 요청 시
            지체없이 파기됩니다.')
          </p>

          <h2>4. 개인정보의 보호를 위한 노력</h2>
          <p>
            (정보를 어떻게 보호하는지 기술적인 부분을 간략히 설명합니다. 예:
            '사용자의 비밀번호는 암호화하여 저장하며, 주기적인 백업과 보안 업데이트를
            통해 데이터를 안전하게 관리하고 있습니다.')
          </p>

          <p>
            개인정보 처리방침에 대한 문의는{" "}
            <a href="mailto:notivior@gmail.com">
              notivior@gmail.com
            </a>
            으로 연락주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
} 