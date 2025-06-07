import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction as RRMetaFunction,
} from "react-router";
import type { loader } from "../profile-layout";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
  export type ActionArgs = ActionFunctionArgs;
  
  type MetaArgs = {
    data: LoaderData;
    params: { [key: string]: string | undefined };
    location: any; 
  };
  
  export interface MetaFunction {
    (args: MetaArgs): ReturnType<RRMetaFunction>;
  }

  export type ComponentProps = {
    loaderData: LoaderData;
    params: { username: string };
  };
} 