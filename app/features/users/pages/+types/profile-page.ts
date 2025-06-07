import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction as RRMetaFunction,
} from "react-router";

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
  export type ActionArgs = ActionFunctionArgs;
  export type MetaFunction = RRMetaFunction;
  export type ComponentProps = {};
} 