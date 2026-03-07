import { View, Text, Image } from "react-native";
import React from "react";
import { Tabs } from "expo-router";

import icons from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: any;
  title: string;
}) => {
  return (
    <View className="flex-1 mt-3 flex flex-col items-center">
      <Image
        source={icon}
        tintColor={focused ? "#C9b581" : "#666876"}
        resizeMode="contain"
        className="size-6"
      />
      <Text
        className={`${focused ? "text-primary-300 font-rubik-medium" : "text-gray-500 font-rubik-regular"} text-xs w-full text-center mt-1`}
      >
        {title}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "white",
          position: "absolute",
          borderTopColor: "#0061FF1A",
          borderTopWidth: 1,
          minHeight: 70,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon icon={icons.home} title="Home" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon icon={icons.search} title="Explore" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <TabIcon icon={icons.person} title="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
