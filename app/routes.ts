import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    index("common/pages/home-page.tsx"),
    route("daily", "routes/daily.tsx"),
    ...prefix("plan", [
        //index("routes/plan/index.tsx"),
        route("tomorrow", "routes/plan/tomorrow.tsx"),
        route("weekly", "routes/plan/weekly.tsx"),
        route("monthly", "routes/plan/monthly.tsx"),
    ]),
    route("stats", "routes/stats.tsx"),
    route("settings", "routes/settings.tsx"),
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
