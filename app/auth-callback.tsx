import { supabase } from "@/lib/supabase";
import * as ExpoLinking from "expo-linking";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

// This screen handles cold-launch deep links: the user is not in the app when
// the OAuth browser redirects to echelon://auth-callback?code=…. The OS opens
// the app fresh and Expo Router navigates here. We exchange the code for a
// session and immediately redirect to the home screen.
export default function AuthCallbackScreen() {
  const url = ExpoLinking.useURL();

  useEffect(() => {
    if (!url) return;

    supabase.auth
      .exchangeCodeForSession(url)
      .then(({ error }) => {
        if (error) {
          console.error("Auth callback error:", error.message);
          router.replace("/sign-in");
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/sign-in"));
  }, [url]);

  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}
    >
      <ActivityIndicator size="large" color="#0061FF" />
      <Text
        style={{
          marginTop: 16,
          fontFamily: "Rubik-Regular",
          fontSize: 15,
          color: "#666876",
        }}
      >
        Finishing sign in…
      </Text>
    </View>
  );
}
