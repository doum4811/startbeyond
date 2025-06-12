import { Resend } from "resend";      
import { render } from "@react-email/components";
import { WelcomeUser } from "react-email-starter/emails/welcome-user";
import { type Route } from "./+types/welcome-page";

const client = new Resend(process.env.RESEND_API_KEY);

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { data, error } = await client.emails.send({
    from: "Notivior <notivior@mail.startbeyond.space>",
    to: ["notivior@gmail.com"],
    subject: "🌟 시작을 기록하면, 변화가 시작돼요 – StartBeyond에 오신 걸 환영해요!",
    react: <WelcomeUser username={"Resend"} />,
  });

  if (error) {
    // Handle error
  }

  return Response.json({ data, error });
};