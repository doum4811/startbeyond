import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("common/pages/home-page.tsx"),
    route("daily", "routes/daily.tsx"),
    route("plan-tomorrow", "routes/plan/tomorrow.tsx"),
    route("plan-weekly", "routes/plan/weekly.tsx"),
    route("plan-monthly", "routes/plan/monthly.tsx"),
    // route("plan-monthly", "routes/plan/monthly.tsx"),
    route("stats", "routes/stats.tsx"),
    route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
