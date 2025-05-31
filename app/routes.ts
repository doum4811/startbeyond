import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    index("common/pages/home-page.tsx"),
    route("daily", "features/daily/pages/daily-page.tsx"),
    ...prefix("plan", [
        index("features/plan/pages/plan-page.tsx"),
        route("tomorrow", "features/plan/pages/tomorrow-page.tsx"),
        route("weekly", "features/plan/pages/weekly-page.tsx"),
        route("monthly", "features/plan/pages/monthly-page.tsx"),
    ]),
    route("stats", "features/stats/pages/stats-page.tsx"),
    route("settings", "features/settings/pages/settings-page.tsx"),
    ...prefix("/auth", [
        layout("features/auth/layouts/auth-layout.tsx", [
          route("/login", "features/auth/pages/login-page.tsx"),
          route("/join", "features/auth/pages/join-page.tsx"),
          ...prefix("/otp", [
            route("/start", "features/auth/pages/otp-start-page.tsx"),
            route("/complete", "features/auth/pages/otp-complete-page.tsx"),
          ]),
          ...prefix("/social/:provider", [
            route("/start", "features/auth/pages/social-start-page.tsx"),
            route("/complete", "features/auth/pages/social-complete-page.tsx"),
          ]),
        ]),
      ]),
] satisfies RouteConfig;
