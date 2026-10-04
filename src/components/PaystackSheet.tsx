import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { colors } from "@/lib/theme";

interface Props {
  visible: boolean;
  publicKey: string; email: string; amountMinor: number; currency: string; reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

// Paystack InlineJS v2 only runs in a browser, so we load it inside a WebView — exactly what the website does,
// and it talks back to the app with postMessage. The app never sees card details.
const buildHtml = (p: Pick<Props, "publicKey" | "email" | "amountMinor" | "currency" | "reference">) => {
  const cfg = JSON.stringify({ key: p.publicKey, email: p.email, amount: p.amountMinor, currency: p.currency, reference: p.reference }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#fff;font-family:-apple-system,Roboto,sans-serif">
<p style="text-align:center;margin-top:40vh;color:#888">Loading secure payment…</p>
<script src="https://js.paystack.co/v2/inline.js"></script>
<script>
  function send(m){ window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  window.addEventListener("load", function () {
    try {
      var cfg = ${cfg};
      new PaystackPop().newTransaction({
        key: cfg.key, email: cfg.email, amount: cfg.amount, currency: cfg.currency, reference: cfg.reference,
        onSuccess: function (t) { send({ type: "success", reference: t.reference }); },
        onCancel: function () { send({ type: "cancel" }); },
        onError: function (e) { send({ type: "error", message: (e && e.message) || "Payment failed" }); }
      });
    } catch (e) { send({ type: "error", message: String((e && e.message) || e) }); }
  });
</script></body></html>`;
};

export default function PaystackSheet({ visible, publicKey, email, amountMinor, currency, reference, onSuccess, onCancel, onError }: Props) {
  const html = useMemo(() => buildHtml({ publicKey, email, amountMinor, currency, reference }), [publicKey, email, amountMinor, currency, reference]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "success" && typeof msg.reference === "string") onSuccess(msg.reference);
      else if (msg.type === "cancel") onCancel();
      else if (msg.type === "error") onError(msg.message || "Payment failed");
    } catch { /* ignore unrelated messages */ }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={s.wrap}>
        <View style={s.bar}>
          <Text style={s.title}>Secure payment</Text>
          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel payment"><Text style={s.cancel}>Cancel</Text></Pressable>
        </View>
        {visible && (
          <WebView
            source={{ html, baseUrl: "https://checkout.paystack.com" }}
            originWhitelist={["*"]} javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false}
            onMessage={onMessage} style={{ flex: 1 }}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white, paddingTop: 48 },
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontWeight: "700", fontSize: 16 },
  cancel: { color: colors.accent, fontWeight: "700" },
});
