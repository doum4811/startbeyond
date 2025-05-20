import type { Route } from "~/common/types";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "홈" },
    { name: "description", content: "홈페이지입니다." },
  ];
}

export function loader({ request }: Route.LoaderArgs) {
  return {
    message: "환영합니다!",
  };
}

export function action({ request }: Route.ActionArgs) {
  return {
    success: true,
  };
}

export default function HomePage({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-4xl font-bold mb-4">{loaderData.message}</h1>
      <p className="text-lg text-gray-600">
        이 웹사이트는 Remix, React Router, TypeScript, Shadcn UI, Radix UI, Tailwind CSS를 사용하여 만들어졌습니다.
      </p> */}
    </div>
  );
} 