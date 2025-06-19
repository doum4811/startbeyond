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
    // route("stats-old", "features/stats/pages/stats-page-old.tsx"),
    ...prefix("stats", [
        route("summary", "features/stats/pages/summary-page.tsx"),
        route("category", "features/stats/pages/category-page.tsx"),
        route("advanced", "features/stats/pages/advanced-page.tsx"),
        route("records", "features/stats/pages/records-page.tsx"),
    ]),
    route("/share/:token", "features/stats/pages/shared-page.tsx"),
    ...prefix("community", [
        index("features/community/pages/community-page.tsx"),
        route("new", "features/community/pages/community-new-post-page.tsx"),
        route(":postId", "features/community/pages/community-post-detail-page.tsx"),
        // route(":postId/edit", "features/community/pages/community-edit-post-page.tsx"), // Add later if edit page is created
    ]),
    route("notifications", "features/notifications/pages/notifications-page.tsx"),
    ...prefix("settings", [
      index("features/settings/pages/categories-settings-page.tsx"),
      route("profile", "features/settings/pages/profile-settings-page.tsx"),
    ]),
    ...prefix("messages", [
        layout("features/messages/layouts/messages-layout.tsx", [
            index("features/messages/pages/messages-page.tsx"),
            route(":conversationId", "features/messages/pages/conversation-page.tsx"),
        ]),
    ]),
    // route("profile", "features/users/pages/profile-settings-page.tsx"),
    // route("edit", "features/users/pages/profile-edit-page.tsx"),
    ...prefix("/auth", [
        layout("features/auth/layouts/auth-layout.tsx", [
          route("/login", "features/auth/pages/login-page.tsx"),
          route("/join", "features/auth/pages/join-page.tsx"),
          ...prefix("/otp", [
            route("/start", "features/auth/pages/otp-start-page.tsx"),
            route("/complete", "features/auth/pages/otp-complete-page.tsx"),
          ]),
          route("/logout", "features/auth/pages/logout-page.tsx"),
          ...prefix("/social/:provider", [
            route("/start", "features/auth/pages/social-start-page.tsx"),
            route("/complete", "features/auth/pages/social-complete-page.tsx"),
          ]),
        ]),
      ]),
      layout("features/users/layouts/profile-layout.tsx", [
        ...prefix("/users/:username", [
          index("features/users/pages/profile-page.tsx"),
          route("posts", "features/users/pages/profile-posts-page.tsx"),
          route("activity", "features/users/pages/profile-activity-page.tsx"),
          route("edit", "features/users/pages/profile-edit-page.tsx"),
        ]),
      ]),
      route("/users/:username/welcome", "features/users/pages/welcome-page.tsx"),
        // CRON Job API Route
  route("api/cron/weekly-summary", "features/notifications/api/weekly-summary.ts"),
] satisfies RouteConfig;
