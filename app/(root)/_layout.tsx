import {useGlobalContext} from "@/lib/global-provider";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator} from "react-native";
import { Redirect, Slot } from "expo-router";



export default function AppLayout() {
    const { loading, isLoggedIn } = useGlobalContext();

    if(loading) {
        return (
            <SafeAreaView className="bg-[#f9f9f1] flex items-center justify-center h-screen">
                <ActivityIndicator className="text-primary-300" size="large"/>
            </SafeAreaView>
        )
    }

    if(!isLoggedIn) return <Redirect href="/sign-in"/>

    return <Slot/>
}