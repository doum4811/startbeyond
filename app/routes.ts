import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("common/pages/home-page.tsx"),
    route("daily", "routes/daily.tsx"),
] satisfies RouteConfig;
