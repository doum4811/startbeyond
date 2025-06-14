import type { LoaderFunctionArgs } from "react-router";
import type { loader } from "../profile-posts-page";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
  export type ComponentProps = {
    loaderData: LoaderData;
  };
} 