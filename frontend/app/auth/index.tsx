import SocialLoginButton from "@/components/SocialLoginButton";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  useWarmUpBrowser();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.headingContainer}>
        <Text style={styles.label}>Login to Smearch</Text>
        <Text style={styles.description}>
          Start shopping with us by logging in to your account
        </Text>
      </View>

      <View style={styles.socialContainer}>
        <SocialLoginButton strategy="google" />
        <SocialLoginButton strategy="facebook" />
        <SocialLoginButton strategy="apple" />
      </View>
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  headingContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  socialContainer: {
    gap: 15,
  },
});
