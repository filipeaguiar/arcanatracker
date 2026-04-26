import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const rememberMe = cookieStore.get("remember_me")?.value;
            cookiesToSet.forEach(({ name, value, options }) => {
              if (rememberMe === "0") {
                delete options.maxAge;
                delete options.expires;
              }
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from Server Component — ignore.
            // The middleware will handle cookie refresh.
          }
        },
      },
    }
  );
}

/**
 * Admin client that bypasses RLS.
 * Use ONLY in trusted server-side contexts (e.g., seed scripts, admin actions).
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const rememberMe = cookieStore.get("remember_me")?.value;
            cookiesToSet.forEach(({ name, value, options }) => {
              if (rememberMe === "0") {
                delete options.maxAge;
                delete options.expires;
              }
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
