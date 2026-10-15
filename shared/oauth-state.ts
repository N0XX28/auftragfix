export type OAuthState = { redirectUri: string; nonce: string };
export function encodeOAuthState(state: OAuthState): string {
  return btoa(JSON.stringify(state));
}
export function decodeOAuthState(value: string): OAuthState {
  const state = JSON.parse(atob(value));
  if (
    typeof state?.redirectUri !== "string" ||
    typeof state?.nonce !== "string" ||
    state.nonce.length < 24 ||
    state.nonce.length > 128
  )
    throw new Error("Ungültiger Anmeldestatus.");
  return { redirectUri: state.redirectUri, nonce: state.nonce };
}
export function verifyOAuthNonce(
  state: string,
  nonce: string | null,
): OAuthState {
  const parsed = decodeOAuthState(state);
  if (!nonce || parsed.nonce !== nonce)
    throw new Error(
      "Anmeldung abgelaufen oder ungültiger Status. Bitte neu anmelden.",
    );
  return parsed;
}
