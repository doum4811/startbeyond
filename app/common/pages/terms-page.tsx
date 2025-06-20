import type { Route } from "~/features/users/+types/my-profile-page";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Terms of Service | StartBeyond" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return {};
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
                {children}
            </div>
        </section>
    );
}

export default function TermsPage() {
    const lastUpdated = "2025년 6월 21일";

  return (
    <div className="bg-background text-foreground">
        <div className="container mx-auto max-w-4xl py-16 px-4">
            <header className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight">이용약관</h1>
              <p className="mt-2 text-muted-foreground">
                최종 업데이트: {lastUpdated}
              </p>
            </header>

            <main className="space-y-10">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p>
                        StartBeyond 서비스(이하 '서비스')에 오신 것을 환영합니다. 본 약관은 StartBeyond와 사용자 간의 서비스 이용에 관한 권리, 의무 및 책임사항, 기타 필요한 사항을 규정하는 것을 목적으로 합니다. 서비스를 이용하시기 전에 본 약관을 주의 깊게 읽어주시기 바랍니다.
                    </p>
                </div>
                
                <Section title="제 1조 (목적)">
                    <p>본 약관은 StartBeyond(이하 "우리")가 제공하는 모든 서비스의 이용조건 및 절차, 회원과 우리 간의 권리, 의무 및 책임사항 등 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                </Section>

                <Section title="제 2조 (용어의 정의)">
                    <p>1. "서비스"라 함은 우리가 제공하는 StartBeyond 웹사이트 및 관련 제반 서비스를 의미합니다.</p>
                    <p>2. "회원"이라 함은 우리와 서비스 이용계약을 체결하고 우리가 제공하는 서비스를 이용하는 고객을 말합니다.</p>
                    <p>3. "게시물"이라 함은 회원이 서비스를 이용함에 있어 서비스상에 게시한 부호, 문자, 음성, 화상, 동영상 등의 정보 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.</p>
                </Section>
                
                <Section title="제 3조 (서비스의 제공 및 변경)">
                    <p>1. 우리는 회원에게 목표 설정, 계획 수립, 일일 기록, 통계, 커뮤니티 등의 서비스를 제공합니다.</p>
                    <p>2. 우리는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다. 서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등은 그 변경 전에 해당 서비스 초기화면에 게시하여야 합니다.</p>
                    <p>3. 현재 제공되는 서비스는 베타(Beta) 버전으로, 서비스의 안정성이나 데이터의 영속성을 완벽하게 보장하지 않을 수 있습니다. 우리는 베타 서비스 기간 동안 예기치 않은 오류나 데이터 손실이 발생할 수 있음을 고지하며, 이로 인한 손해에 대해 책임을 지지 않습니다.</p>
                </Section>
                
                <Section title="제 4조 (회원가입 및 계정)">
                     <p>1. 회원은 우리가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
                     <p>2. 회원은 자신의 계정 정보를 최신으로 유지해야 하며, 계정의 비밀번호 등 보안 유지의 책임은 회원 본인에게 있습니다. 계정 정보의 부실 기재 또는 도용으로 인한 손해의 책임은 회원이 부담합니다.</p>
                </Section>

                <Section title="제 5조 (회원의 의무 및 금지행위)">
                    <p>회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ol>
                        <li>타인의 정보를 도용하는 행위</li>
                        <li>우리 또는 제3자의 저작권 등 지적재산권을 침해하는 행위</li>
                        <li>우리 또는 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                        <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                        <li>우리의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
                        <li>서비스의 안정적 운영을 방해할 수 있는 정보통신설비의 오작동이나 정보 등의 파괴를 유발시키는 컴퓨터 바이러스, 데이터, 프로그램, 파일 등을 유포하는 행위</li>
                    </ol>
                </Section>

                <Section title="제 6조 (서비스 이용의 제한 및 정지)">
                    <p>우리는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.</p>
                </Section>

                <Section title="제 7조 (책임의 제한)">
                     <p>1. 우리는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                     <p>2. 우리는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
                     <p>3. 우리는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</p>
                </Section>

                <Section title="제 8조 (약관의 개정)">
                    <p>우리는 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다. 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
                </Section>
                
                <Section title="제 9조 (준거법 및 재판관할)">
                    <p>1. 우리와 회원 간에 발생한 분쟁에 대하여는 대한민국법을 준거법으로 합니다.</p>
                    <p>2. 우리와 회원 간 발생한 분쟁에 관한 소송은 민사소송법 상의 관할법원에 제소합니다.</p>
                </Section>
            </main>
        </div>
    </div>
  );
} 