import { describe, expect, it } from "vitest";
import {
  decodeOAuthState,
  encodeOAuthState,
  verifyOAuthNonce,
} from "../shared/oauth-state";
describe("Gebundener OAuth-Status", () => {
  const nonce = "a".repeat(64);
  const redirectUri = "https://example.com/api/oauth/callback";
  it("kodiert Weiterleitung und Nonce eindeutig", () => {
    expect(decodeOAuthState(encodeOAuthState({ redirectUri, nonce }))).toEqual({
      redirectUri,
      nonce,
    });
  });
  it("verweigert fehlende und fremde Nonces", () => {
    const state = encodeOAuthState({ redirectUri, nonce });
    expect(() => verifyOAuthNonce(state, null)).toThrow();
    expect(() => verifyOAuthNonce(state, "b".repeat(64))).toThrow();
    expect(verifyOAuthNonce(state, nonce).redirectUri).toBe(redirectUri);
  });
  it("akzeptiert keinen alten beliebigen Redirect-String", () => {
    expect(() => decodeOAuthState(btoa(redirectUri))).toThrow();
    expect(() =>
      decodeOAuthState(encodeOAuthState({ redirectUri, nonce: "short" })),
    ).toThrow();
  });
});
