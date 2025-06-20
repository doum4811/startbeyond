import type { Route } from "~/features/users/+types/my-profile-page";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Privacy Policy | StartBeyond" }];
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

export default function PrivacyPage() {
    const lastUpdated = "2025년 6월 21일";

  return (
    <div className="bg-background text-foreground">
        <div className="container mx-auto max-w-4xl py-16 px-4">
            <header className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight">개인정보처리방침</h1>
              <p className="mt-2 text-muted-foreground">
                최종 업데이트: {lastUpdated}
              </p>
            </header>

            <main className="space-y-10">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p>
                        StartBeyond(이하 "우리")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다. 본 개인정보처리방침은 우리가 제공하는 StartBeyond 서비스(이하 '서비스')에 적용됩니다.
                    </p>
                </div>
                
                <Section title="제 1조 (개인정보의 수집 항목 및 수집 방법)">
                    <p>1. 우리는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 최소한의 개인정보를 필수항목으로 수집하고 있습니다.</p>
                    <ul>
                        <li>필수항목: 이메일 주소, 비밀번호, 이름(닉네임)</li>
                        <li>소셜 로그인 시: 소셜 서비스 제공사로부터 받는 이용자 식별 정보, 프로필 이미지, 이메일 주소</li>
                        <li>서비스 이용 과정에서 자동 생성 정보: IP 주소, 쿠키, 서비스 이용 기록, 기기 정보</li>
                    </ul>
                     <p>2. 우리는 다음과 같은 방법으로 개인정보를 수집합니다.</p>
                     <ul>
                        <li>회원가입 및 서비스 이용 과정에서 이용자가 개인정보 수집에 대해 동의를 하고 직접 정보를 입력하는 경우</li>
                        <li>제휴 서비스 또는 단체 등으로부터 개인정보를 제공받는 경우</li>
                        <li>고객센터를 통한 상담 과정에서 웹페이지, 메일, 팩스, 전화 등을 통해 개인정보를 수집하는 경우</li>
                     </ul>
                </Section>
                
                <Section title="제 2조 (개인정보의 수집 및 이용 목적)">
                    <p>우리는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                    <ul>
                        <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 연령확인, 불만처리 등 민원처리, 고지사항 전달</li>
                        <li>서비스 제공: 콘텐츠 제공, 맞춤 서비스 제공, 본인인증 등 서비스 제공에 관한 계약 이행</li>
                        <li>신규 서비스 개발 및 마케팅·광고에의 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
                    </ul>
                </Section>
                
                <Section title="제 3조 (개인정보의 보유 및 이용기간)">
                    <p>우리는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 우리는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
                     <ul>
                        <li>계약 또는 청약철회 등에 관한 기록 : 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록 : 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li>소비자의 불만 또는 분쟁처리에 관한 기록 : 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li>웹사이트 방문기록 : 3개월 (통신비밀보호법)</li>
                     </ul>
                </Section>

                <Section title="제 4조 (개인정보의 파기절차 및 방법)">
                    <p>우리는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.</p>
                    <ul>
                        <li>파기절차: 회원이 회원가입 등을 위해 입력하신 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다.</li>
                        <li>파기방법: 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                    </ul>
                </Section>

                <Section title="제 5조 (개인정보의 제3자 제공)">
                    <p>우리는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
                    <ul>
                        <li>이용자들이 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                </Section>

                <Section title="제 6조 (이용자의 권리 및 행사방법)">
                     <p>1. 이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다.</p>
                     <p>2. 이용자의 개인정보 조회, 수정을 위해서는 '개인정보변경'(또는 '회원정보수정' 등)을, 가입해지(동의철회)를 위해서는 "회원탈퇴"를 클릭하여 본인 확인 절차를 거치신 후 직접 열람, 정정 또는 탈퇴가 가능합니다.</p>
                </Section>

                <Section title="제 7조 (개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항)">
                     <p>우리는 이용자에게 특화된 맞춤서비스를 제공하기 위해서 이용자들의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버(HTTP)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터 내의 하드디스크에 저장되기도 합니다. 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
                </Section>

                <Section title="제 8조 (개인정보 보호책임자)">
                    <p>우리는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를 지정하고 있습니다.</p>
                    <ul>
                        <li>개인정보 보호책임자: Yong</li>
                        <li>이메일: <a href="mailto:notivior@gmail.com">notivior@gmail.com</a></li>
                    </ul>
                    <p>기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.</p>
                     <ul>
                        <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
                        <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)</li>
                        <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
                     </ul>
                </Section>
            </main>
        </div>
    </div>
  );
} 