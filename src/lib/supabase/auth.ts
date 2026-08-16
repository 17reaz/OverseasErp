import { supabase } from "./client";

export async function signIn(
  email: string,
  password: string,
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(
  email: string,
  password: string,
) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getSession() {
  return await supabase.auth.getSession();
}

export async function getUser() {
  return await supabase.auth.getUser();
}
export async function getProfile(userId: string) {
  return await supabase
    .from("profiles")
    .select(`
      id,
      tenant_id,
      full_name,
      phone,
      avatar_url,
      role,
      is_active
    `)
    .eq("id", userId)
    .single();
}
export async function getTenant(tenantId: string) {
  return await supabase
    .from("tenants")
    .select(`
      id,
      name,
      slug,
      logo_url,
      phone,
      email,
      website,
      country,
      timezone,
      language,
      currency,
      is_active
    `)
    .eq("id", tenantId)
    .single();
}