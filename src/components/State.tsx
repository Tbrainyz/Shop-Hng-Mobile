import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import Button from "./Button";

export const Loading = () => <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>;

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={s.center}>
    <Text style={s.msg}>{message}</Text>
    {onRetry && <Button title="Try again" variant="dark" onPress={onRetry} />}
  </View>
);

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 20 },
  msg: { color: colors.muted, textAlign: "center", fontSize: 15 },
});
