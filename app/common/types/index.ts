import type { MetaFunction as RemixMetaFunction } from "react-router";

export namespace Route {
  export type LoaderArgs = {
    request: Request;
    params: Record<string, string>;
  };

  export type ActionArgs = LoaderArgs;

  export type MetaFunction = RemixMetaFunction;

  export type MetaArgs = {
    data: any;
    params: Record<string, string>;
  };

  export type ComponentProps = {
    loaderData: any;
    actionData: any;
  };
} 