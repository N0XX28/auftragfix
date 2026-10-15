import { randomBytes } from "node:crypto";
import { parse } from "cookie";
import { ONE_YEAR_MS } from "../../shared/const.js";
import {
  decodeOAuthState,
  encodeOAuthState,
  verifyOAuthNonce,
} from "../../shared/oauth-state";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieName, getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const NONCE_COOKIE = "auftragfix_oauth_nonce";
const NATIVE_CALLBACK = "manus221037796687825://oauth/callback";
function validNativeRedirect(value: string): boolean {
  try {
    if (value === NATIVE_CALLBACK) return true;
    const url = new URL(value);
    const packager = process.env.EXPO_PACKAGER_PROXY_URL;
    return (
      !!packager &&
      ["exp:", "exps:"].includes(url.protocol) &&
      url.hostname === new URL(packager).hostname &&
      url.pathname.endsWith("/oauth/callback") &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
function getQueryParam(req: Request, key: string) {
  const v = req.query[key];
  return typeof v === "string" ? v : undefined;
}
function apiOrigin(): string {
  const configured =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PACKAGER_PROXY_URL?.replace("8081-", "3000-");
  if (!configured) throw new Error("Öffentliche API-Adresse fehlt.");
  return new URL(configured).origin;
}
function frontendUrl(): string {
  const url =
    process.env.EXPO_WEB_PREVIEW_URL || process.env.EXPO_PACKAGER_PROXY_URL;
  if (!url) throw new Error("Öffentliche App-Adresse fehlt.");
  return new URL(url).origin;
}
function authorizationUrl(redirectUri: string, nonce: string): string {
  const base =
    process.env.MANUS_OAUTH_PORTAL_URL ?? process.env.VITE_OAUTH_PORTAL_URL;
  if (!base || !ENV.appId) throw new Error("Anmeldung ist nicht konfiguriert.");
  const url = new URL("/app-auth", base);
  url.searchParams.set("appId", ENV.appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", encodeOAuthState({ redirectUri, nonce }));
  url.searchParams.set("responseType", "code");
  return url.toString();
}
async function syncUser(info: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!info.openId) throw new Error("Anmeldekennung fehlt.");
  await upsertUser({
    openId: info.openId,
    name: info.name || null,
    email: info.email ?? null,
    loginMethod: info.loginMethod ?? info.platform ?? null,
    lastSignedIn: new Date(),
  });
  const user = await getUserByOpenId(info.openId);
  if (!user) throw new Error("Benutzerkonto konnte nicht gespeichert werden.");
  return user;
}
function buildUserResponse(
  user: NonNullable<Awaited<ReturnType<typeof getUserByOpenId>>>,
) {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    lastSignedIn: user.lastSignedIn.toISOString(),
  };
}
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req, res) => {
    try {
      const nonce = randomBytes(32).toString("hex");
      const redirectUri = apiOrigin() + "/api/oauth/callback";
      res.cookie(NONCE_COOKIE, nonce, {
        ...getSessionCookieOptions(req),
        maxAge: 10 * 60 * 1000,
      });
      res.redirect(302, authorizationUrl(redirectUri, nonce));
    } catch {
      res
        .status(503)
        .json({ error: "Die Anmeldung ist momentan nicht verfügbar." });
    }
  });
  app.get("/api/oauth/native-start", (req, res) => {
    try {
      const redirectUri = getQueryParam(req, "redirectUri") ?? NATIVE_CALLBACK;
      if (!validNativeRedirect(redirectUri)) {
        res.status(400).json({ error: "Ungültige App-Weiterleitung." });
        return;
      }
      const nonce = randomBytes(32).toString("hex");
      res.setHeader("Cache-Control", "no-store");
      res.json({ nonce, url: authorizationUrl(redirectUri, nonce) });
    } catch {
      res
        .status(503)
        .json({ error: "Die Anmeldung ist momentan nicht verfügbar." });
    }
  });
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code"),
      state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "Anmeldecode oder Status fehlt." });
      return;
    }
    try {
      const nonce = parse(req.headers.cookie ?? "")[NONCE_COOKIE] ?? null;
      const parsed = verifyOAuthNonce(state, nonce);
      if (parsed.redirectUri !== apiOrigin() + "/api/oauth/callback")
        throw new Error("Ungültige Weiterleitung.");
      res.clearCookie(NONCE_COOKIE, getSessionCookieOptions(req));
      const token = await sdk.exchangeCodeForToken(code, state);
      const info = await sdk.getUserInfo(token.accessToken);
      await syncUser(info);
      const session = await sdk.createSessionToken(info.openId!, {
        name: info.name || "Werkstatt",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(getSessionCookieName(req), session, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, frontendUrl());
    } catch {
      res.clearCookie(NONCE_COOKIE, getSessionCookieOptions(req));
      res
        .status(400)
        .json({
          error:
            "Anmeldung ungültig oder abgelaufen. Bitte aus der App neu anmelden.",
        });
    }
  });
  app.get("/api/oauth/mobile", async (req, res) => {
    const code = getQueryParam(req, "code"),
      state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "Anmeldecode oder Status fehlt." });
      return;
    }
    try {
      if (!validNativeRedirect(decodeOAuthState(state).redirectUri))
        throw new Error("Ungültige mobile Weiterleitung.");
      const token = await sdk.exchangeCodeForToken(code, state);
      const info = await sdk.getUserInfo(token.accessToken);
      const user = await syncUser(info);
      const session = await sdk.createSessionToken(info.openId!, {
        name: info.name || "Werkstatt",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(getSessionCookieName(req), session, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.json({ app_session_id: session, user: buildUserResponse(user) });
    } catch {
      res
        .status(400)
        .json({
          error: "Mobile Anmeldung fehlgeschlagen. Bitte erneut anmelden.",
        });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(getSessionCookieName(req), {
      ...getSessionCookieOptions(req),
      maxAge: -1,
    });
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch {
      res.status(401).json({ error: "Nicht angemeldet", user: null });
    }
  });
  app.post("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const header = req.headers.authorization;
      if (typeof header !== "string" || !header.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer-Token erforderlich" });
        return;
      }
      res.cookie(getSessionCookieName(req), header.slice(7).trim(), {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch {
      res.status(401).json({ error: "Ungültige Sitzung" });
    }
  });
}
