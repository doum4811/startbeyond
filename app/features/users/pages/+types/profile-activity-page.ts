import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction as ReactRouterMetaFunction,
  } from "react-router";
  
  import type { loader as profileActivityLoader } from "../pages/profile-activity-page";

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
    export type ActionArgs = ActionFunctionArgs;
    export type MetaFunction = ReactRouterMetaFunction;
  export type ComponentProps = {
      loaderData: Awaited<ReturnType<typeof profileActivityLoader>>;
  };
    export type ErrorBoundaryProps = { error: any };
    export type LinksFunction = () => { rel: string; href: string }[];
} 