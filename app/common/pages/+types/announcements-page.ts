import type {
    LoaderFunctionArgs,
    MetaFunction as ReactRouterMetaFunction,
  } from "react-router";
  
  import type { loader as announcementsLoader } from "../announcements-page";

export namespace Route {
    export type LoaderArgs = LoaderFunctionArgs;
    export type MetaFunction = ReactRouterMetaFunction;
    export type ComponentProps = {
        loaderData: Awaited<ReturnType<typeof announcementsLoader>>;
    };
} 