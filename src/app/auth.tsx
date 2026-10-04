import { Redirect } from "expo-router";

// The sign-in flow ends by opening <scheme>://auth?token=... The token is captured in lib/auth.tsx;
// this route only exists so Expo Router doesn't show "unmatched route" if it also sees that link.
export default function AuthLanding() {
  return <Redirect href="/" />;
}
