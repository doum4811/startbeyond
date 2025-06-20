import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface WelcomeUserProps {
  username?: string;
  magicLink?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:5173";

export const WelcomeUser = ({
  username,
  magicLink,
}: WelcomeUserProps) => (
  <Html>
    <Head />
    <Preview>시작을 기록하면, 변화가 시작돼요.</Preview>
    <Tailwind>
      <Body className="mx-auto my-auto bg-white font-sans">
        <Container className="mx-auto my-10 w-[465px] rounded border border-solid border-gray-200 p-5">
          <Section className="mt-8 text-center">
            <Img
              src={`${baseUrl}/static/startbeyond-logo.png`}
              width="120"
              alt="StartBeyond"
              className="mx-auto my-0"
            />
          </Section>
          <Heading className="mx-0 my-7 p-0 text-center text-2xl font-normal text-black">
            안녕하세요, {username}님! 👋
            <br />
            StartBeyond에 오신 걸 환영해요!
            <br />
            함께하게 되어 정말 반가워요.
          </Heading>
          <Text className="text-sm leading-6 text-black">
            우리는 <strong>"작은 기록이 큰 변화를 만든다"</strong>는 믿음으로
            시작했어요. 매일의 삶을 정리하고, 스스로를 더 잘 이해하는 데 도움을
            주는 공간을 만들고 싶었거든요.
          </Text>
          <Text className="text-sm leading-6 text-black">
            StartBeyond는 기록을 통해 삶을 돌아보고, 더 나은 방향으로 나아가고
            싶은 모든 분들을 위해 존재해요. 딱딱하지 않게, 그렇다고 가볍지도
            않게. 당신의 삶에 자연스럽게 녹아드는{" "}
            <strong>기록의 루틴</strong>, 그 시작을 함께하길 기대해요.
          </Text>
          <Section className="my-8 text-center">
            <Text className="mb-4 text-center text-lg">
              👉 지금 바로 오늘의 기록을 남겨보세요.
            </Text>
            <Button
              className="rounded-full bg-black px-5 py-3 text-center text-sm font-semibold text-white no-underline"
              href={magicLink}
            >
              첫 기록 남기러 가기
            </Button>
          </Section>
          <Text className="text-sm leading-6 text-black">
            첫 줄을 쓰는 순간, 변화를 향한 첫걸음이 시작됩니다.
            <br />
            <br />
            기록이 당신을 더 빛나게 해줄 거예요.
            <br />
            StartBeyond 팀 드림
          </Text>
          <Hr className="mx-0 my-6 w-full border border-solid border-gray-200" />
          <Text className="text-xs leading-6 text-gray-500">
            © 2024 StartBeyond, Inc. All Rights Reserved.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

WelcomeUser.PreviewProps = {
  username: "notivior",
  magicLink: "https://startbeyond.space/records/new",
} as WelcomeUserProps;

export default WelcomeUser;
  