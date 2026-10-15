import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OAUTH_NONCE_KEY } from "../../constants/oauth";
import { exchangeOAuthCode } from "../../lib/_core/api";
import { setSessionToken, setUserInfo } from "../../lib/_core/auth";
import { verifyOAuthNonce } from "../../shared/oauth-state";
import { Button, C } from "../../components/workshop/ui";

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function finish() {
      try {
        if (params.error) throw new Error("Anmeldung wurde abgebrochen.");
        if (!params.code || !params.state)
          throw new Error("Anmeldecode fehlt. Bitte neu anmelden.");
        const raw = await SecureStore.getItemAsync(OAUTH_NONCE_KEY);
        const pending = raw ? JSON.parse(raw) : null;
        if (!pending || pending.expiresAt < Date.now())
          throw new Error("Anmeldung ist abgelaufen. Bitte erneut starten.");
        verifyOAuthNonce(params.state, pending.nonce);
        const result = await exchangeOAuthCode(params.code, params.state);
        if (!result.sessionToken)
          throw new Error("Keine gültige Sitzung erhalten.");
        await setSessionToken(result.sessionToken);
        if (result.user)
          await setUserInfo({
            ...result.user,
            lastSignedIn: new Date(result.user.lastSignedIn),
          });
        await SecureStore.deleteItemAsync(OAUTH_NONCE_KEY);
        router.replace("/(tabs)");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
      }
    }
    void finish();
  }, [params.code, params.state, params.error, router]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          padding: 30,
        }}
      >
        {error ? (
          <>
            <Text style={{ color: C.ink, fontSize: 22, fontWeight: "700" }}>
              Anmeldung nicht abgeschlossen
            </Text>
            <Text style={{ color: C.red, textAlign: "center", lineHeight: 22 }}>
              {error}
            </Text>
            <Button
              label="Zurück zur App"
              onPress={() => router.replace("/(tabs)")}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={C.orange} size="large" />
            <Text style={{ color: C.ink }}>
              Ihre Anmeldung wird abgeschlossen …
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
