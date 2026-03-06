import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { login } from "@/lib/appwrite";
import {Alert } from "react-native"

import icons from "@/constants/icons";
import images from "@/constants/images";

const SignIn = () => {
  const handleLogin = async () => {
    const result = await login();

    if(result) {
      console.log('Login Sucess')
    } else {
      Alert.alert('Error', "Failed to login")
    }
  };
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full">
        <Image
          source={images.onboarding}
          className="w-full h-4/6"
          resizeMode="contain"
        />
        <View className="px-10">
          <Text className="text-base text-center uppercase font-rubik text-accent-200">
            Welcome to Echelon Realty
          </Text>
          <Text className="text-3xl font-rubik-bold text-center font-bold mt-2 text-[#2c2c2c]">
            Let&apos;s Get You Closer to {"\n"}{" "}
            <Text className="text-primary-300">Your Dream Home</Text>
          </Text>

          <Text className="tet-lg font-rubik-medium text-black-300 text-center mt-12">
            Login to Echelon with Google
          </Text>

          <Pressable
            onPress={handleLogin}
            className="bg-primary-100 shadow-md shadow-zinc-300  py-5 rounded-full mt-5 w-full flex flex-row items-center justify-center gap-2"
          >
            <Image source={icons.google} className="w-5 h-5" />
            <Text className="text-lg font-rubik-medium text-black-400 ml-2">Continue with Google</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
