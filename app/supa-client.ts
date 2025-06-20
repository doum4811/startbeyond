import {
    createBrowserClient,
    createServerClient,
    parseCookieHeader,
    serializeCookieHeader,
    type CookieOptions,
  } from "@supabase/ssr";
  import type { Database as SupabaseDatabase } from "database.types";
  
  export const browserClient = createBrowserClient<SupabaseDatabase>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  
  export const makeSSRClient = (request: Request) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const parsedCookies = parseCookieHeader(cookieHeader);
    const headers = new Headers();
  
    const serverSideClient = createServerClient<SupabaseDatabase>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = parsedCookies.find((c) => c.name === name);
            return cookie?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          },
          remove(name: string, options: CookieOptions) {
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, "", { ...options, maxAge: 0 }),
            );
          },
        },
      }
    );
  
    return {
      client: serverSideClient,
      headers,
    };
  };
  