import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

const bundleId = "space.manus.auftrag.t221037796687825";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const scheme = `manus${timestamp}`;
const extra = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string | undefined
>;
export const OAUTH_PORTAL_URL =
  extra.oauthPortalUrl ?? process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "";
export const OAUTH_SERVER_URL =
  extra.oauthServerUrl ?? process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "";
export const APP_ID = extra.appId ?? process.env.EXPO_PUBLIC_APP_ID ?? "";
export const OWNER_OPEN_ID = process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "";
export const OWNER_NAME = process.env.EXPO_PUBLIC_OWNER_NAME ?? "";
export const API_BASE_URL =
  extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";
export const OAUTH_NONCE_KEY = "auftragfix-oauth-nonce";

export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const hostname = window.location.hostname.replace(/^8081-/, "3000-");
    if (hostname !== window.location.hostname)
      return `${window.location.protocol}//${hostname}`;
  }
  return "";
}
export function getRedirectUri(): string {
  return Platform.OS === "web"
    ? `${getApiBaseUrl()}/api/oauth/callback`
    : Linking.createURL("/oauth/callback", { scheme });
}
export function getLoginUrl(): string {
  return `${getApiBaseUrl()}/api/oauth/start`;
}
export async function startOAuthLogin(): Promise<string | null> {
  if (Platform.OS === "web") {
    window.location.assign(getLoginUrl());
    return null;
  }
  const query = new URLSearchParams({ redirectUri: getRedirectUri() });
  const response = await fetch(
    `${getApiBaseUrl()}/api/oauth/native-start?${query}`,
  );
  if (!response.ok) throw new Error("Anmeldung konnte nicht gestartet werden.");
  const result = (await response.json()) as { nonce: string; url: string };
  if (!result.nonce || !result.url)
    throw new Error("Anmeldung ist momentan nicht verfügbar.");
  await SecureStore.setItemAsync(
    OAUTH_NONCE_KEY,
    JSON.stringify({
      nonce: result.nonce,
      expiresAt: Date.now() + 10 * 60 * 1000,
    }),
  );
  await Linking.openURL(result.url);
  return null;
}
