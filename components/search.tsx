import icons from "@/constants/icons";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import { useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";

const Search = () => {
  const path = usePathname();
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query || "");

  const [debouncedSearch] = useDebounce(
    (text: string) => router.setParams({ query: text }),
    500,
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  return (
    <View className="flex flex-row items-center justify-between w-fit rounded-2xl bg-[#f9f9f1] border border-primary-100 mt-5 py-2 px-4">
      <View className="flex-1 flex flex-row items-center justify-start z-50">
        <Image source={icons.search} className="size-4" />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search for Properties"
          className="text-sm font-rubik text-black-300 ml-3 flex flex-1 justify-end items-end"
        />
      </View>
      <Pressable>
        <Image source={icons.filter} className="size-6" />
      </Pressable>
    </View>
  );
};

export default Search;
function useDebouncedCallback(arg0: (text: string) => void, arg1: number) {
  throw new Error("Function not implemented.");
}
