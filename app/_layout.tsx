import { GlobalProvider } from "@/lib/global-provider";
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";
import * as ExpoLinking from "expo-linking";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "./globals.css";

SplashScreen.preventAutoHideAsync().catch(console.warn);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
  });

  // Handle deep links that arrive while the app is foregrounded (warm launch).
  // openAuthSessionAsync intercepts OAuth redirects before this fires, so this
  // is the safety net for magic links (password reset, email change) and edge
  // cases on older Android where the OS delivers the URL to the app directly.
  useEffect(() => {
    const subscription = ExpoLinking.addEventListener("url", ({ url }) => {
      if (url.includes("auth-callback")) {
        supabase.auth.exchangeCodeForSession(url).catch(console.error);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </GlobalProvider>
  );
}
