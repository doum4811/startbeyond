import {
    createBrowserClient,
    createServerClient,
    parseCookieHeader,
    serializeCookieHeader,
  } from "@supabase/ssr";
  import type { Database as SupabaseDatabase } from "database.types";
  
  export const browserClient = createBrowserClient<SupabaseDatabase>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  
  export const makeSSRClient = (request: Request) => {
    const headers = new Headers();
  
    const serverSideClient = createServerClient<SupabaseDatabase>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const parsed = parseCookieHeader(request.headers.get("Cookie") ?? "");
            // value가 undefined인 경우를 제외
            return parsed
              .filter((c) => typeof c.value === "string")
              .map((c) => ({ name: c.name, value: c.value as string }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              headers.append(
                "Set-Cookie",
                serializeCookieHeader(name, value, options)
              );
            });
          },
        },
      }
    );
  
    return {
      client: serverSideClient,
      headers,
    };
  };
  