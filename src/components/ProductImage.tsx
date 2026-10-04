import { Image } from "expo-image";
import type { ImageStyle, StyleProp } from "react-native";
import { imageUrl } from "@/lib/api";

// expo-image (not React Native's <Image>) because most product images are .svg files.
export default function ProductImage({ path, style }: { path: string; style?: StyleProp<ImageStyle> }) {
  return <Image source={{ uri: imageUrl(path) }} style={style} contentFit="contain" transition={150} />;
}
