import { createBrowserClient } from "@supabase/ssr";

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return undefined;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name);
        },
        set(name: string, value: string, options: any) {
          if (typeof document === "undefined") return;
          const rememberMe = getCookie("remember_me");
          if (rememberMe === "0") {
            delete options.maxAge;
            delete options.expires;
          }
          let cookieStr = `${name}=${encodeURIComponent(value)}`;
          if (options.path) cookieStr += `; path=${options.path}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
          if (options.expires) cookieStr += `; expires=${options.expires.toUTCString()}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
          document.cookie = cookieStr;
        },
        remove(name: string, options: any) {
          if (typeof document === "undefined") return;
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    }
  );
}
