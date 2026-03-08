import { Models } from "react-native-appwrite";

export interface Property extends Models.Document {
  name: string;
  type: string;
  description: string;
  address: string;
  image: string;
  rating: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number | string;
  facilities: string[];
  gallery: { image: string; $id: string }[];
  reviews: any[];
  agent: {
    name: string;
    email: string;
    avatar: string;
  };
}
