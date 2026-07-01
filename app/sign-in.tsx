import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, ScrollView, Text, Pressable, View } from 'react-native';

import { Redirect, router } from 'expo-router';

import { loginWithGoogle } from '@/lib/supabase';
import { useGlobalContext } from '@/lib/global-provider';
import icons from '@/constants/icons';
import images from '@/constants/images';

const Auth = () => {
  const { refetch, loading, isLoggedIn } = useGlobalContext();

  if (!loading && isLoggedIn) return <Redirect href="/" />;

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result) {
      refetch({});
    } else {
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <Image
          source={images.onboarding}
          className="w-full h-4/6"
          resizeMode="contain"
        />

        <View className="px-10">
          <Text className="text-base text-center uppercase font-rubik text-secondary-300">
            Welcome To Echelon Realty
          </Text>

          <Text className="text-3xl font-rubik-bold text-[#2c2c2c] text-center mt-2">
            {"Let's Get You Closer To\n"}
            <Text className="text-primary-300">Your Ideal Home</Text>
          </Text>

          <View className="mt-12 gap-3">
            <Pressable
              onPress={handleGoogleLogin}
              className="bg-primary-100 shadow-md shadow-zinc-300 rounded-full w-full py-4"
            >
              <View className="flex flex-row items-center justify-center">
                <Image source={icons.google} className="w-5 h-5" resizeMode="contain" />
                <Text className="text-lg font-rubik-medium text-black-300 ml-2">
                  Continue with Google
                </Text>
              </View>
            </Pressable>

            <View className="flex flex-row items-center gap-3 my-1">
              <View className="flex-1 h-px bg-primary-200" />
              <Text className="text-sm font-rubik text-black-100">or</Text>
              <View className="flex-1 h-px bg-primary-200" />
            </View>

            <Pressable
              onPress={() => router.push('/auth')}
              className="border border-primary-300 rounded-full w-full py-4"
            >
              <Text className="text-lg font-rubik-medium text-primary-300 text-center">
                Continue with Email
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Auth;
