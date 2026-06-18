import { supabase } from "@/integrations/supabase/client";

export class BodsProxyAuthError extends Error {
  constructor(message = "Sign in to use live travel data") {
    super(message);
    this.name = "BodsProxyAuthError";
  }
}

export async function callBodsProxy<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  // If session is null, try refreshing
  const accessToken =
    session?.access_token ??
    (await supabase.auth.refreshSession()).data.session?.access_token;
  if (!accessToken) {
    throw new BodsProxyAuthError("Sign in to see live data");
  }


  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bods-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.error || `Edge function returned ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}