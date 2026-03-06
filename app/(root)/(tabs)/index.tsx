import { Link } from "expo-router";
import { Text, View } from "react-native";
import "./../../globals.css";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-6">
      <Text className="font-bold text-3xl my-10 font-rubik">
        Welcome to Echelon Realty!
      </Text>
      <Link href="/sign-in">Sign In</Link>
      <Link href="/explore">Explore</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/properties/[id]">Property</Link>
    </View>
  );
}
