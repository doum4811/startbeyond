import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
  type MetaFunction,
  type ShouldRevalidateFunction,
} from "react-router";
import "./i18n";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import * as Sentry from "@sentry/react";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import Navigation from "./common/components/navigation";
import { Footer } from "./common/components/footer";
import { Settings } from "luxon";

import { makeSSRClient } from "./supa-client";
import { cn } from "./common/lib/utils";

import { getUserById } from "./features/users/queries";
import { getUnreadNotificationCount } from "./features/notifications/queries";
import { getUnreadMessageCount } from "./features/messages/queries";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1,
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10%의 세션을 녹화합니다.
    replaysOnErrorSampleRate: 1.0, // 에러가 발생한 세션은 100% 녹화합니다.
  });
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  Settings.defaultLocale = "ko";
  Settings.defaultZone = "Asia/Seoul";
  return (
    // <html lang="en" className="">
    <html lang={i18n.language} className="dark" >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <main>{children}</main>
        <Footer />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}// export default function App() {
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  // return { user };
  if (user) {
    const profile = await getUserById(client, { id: user?.id });
    const unreadNotifications = await getUnreadNotificationCount(client, { userId: user.id });
    const unreadMessages = await getUnreadMessageCount(client, user.id);
    return { user, profile, hasNotifications: unreadNotifications > 0, hasMessages: unreadMessages > 0 };
  }
  return { user: null, profile: null, hasNotifications: false, hasMessages: false };
};

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
}) => {
  // Action이 실행된 경우 (데이터 변경) 항상 revalidate
  if (formMethod && formMethod.toLowerCase() !== "get") {
    return true;
  }

  // URL의 search params만 변경된 경우 revalidate 방지
  if (
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search !== nextUrl.search
  ) {
    return false;
  }
  
  // 기본적으로 revalidate (초기 로드 등)
  return true;
};

export default function App({ loaderData }: Route.ComponentProps) {
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const isLoggedIn = loaderData.user !== null;
  return (
    // <div className={pathname.includes("/auth/") ? "" : "py-28 px-20"}>
    <div
    className={cn({
      "py-28 px-5 md:px-20": !pathname.includes("/auth/"),
      "transition-opacity animate-pulse": isLoading,
    })}
  >
      {pathname.includes("/auth") ? null : (
        <Navigation
          isLoggedIn={isLoggedIn}
          username={loaderData.profile?.username}
          avatar={loaderData.profile?.avatar_url}
          name={loaderData.profile?.full_name}
          hasNotifications={loaderData.hasNotifications}
          hasMessages={loaderData.hasMessages}
        />
      )}
      <Outlet />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
