import type { meta } from "../contact-page";

export namespace Route {
  export type MetaFunction = typeof meta;
  export type ComponentProps = Record<string, never>;
} 