"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";

  const cookieStore = await cookies();
  if (remember) {
    cookieStore.set("remember_me", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 }); // 1 year
  } else {
    // Setting without maxAge so it acts as a session cookie, or simply set it so it's read correctly
    cookieStore.set("remember_me", "0", { path: "/" }); 
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { message: "Verifique seu e-mail para confirmar o cadastro." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  const cookieStore = await cookies();
  cookieStore.delete("remember_me");
  
  revalidatePath("/", "layout");
  redirect("/login");
}
