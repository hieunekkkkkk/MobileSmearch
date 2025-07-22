import { useOAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { checkNetworkConnectivity, retryWithBackoff } from "@/utils/network";

const SocialLoginButton = ({
  strategy,
}: {
  strategy: "facebook" | "google" | "apple";
}) => {
  const getStrategy = () => {
    if (strategy === "facebook") {
      return "oauth_facebook";
    } else if (strategy === "google") {
      return "oauth_google";
    } else if (strategy === "apple") {
      return "oauth_apple";
    }
    return "oauth_facebook";
  };

  const { startOAuthFlow } = useOAuth({ strategy: getStrategy() });
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const buttonText = () => {
    if (isLoading) {
      return "Loading...";
    }

    if (strategy === "facebook") {
      return "Continue with Facebook";
    } else if (strategy === "google") {
      return "Continue with Google";
    } else if (strategy === "apple") {
      return "Continue with Apple";
    }

    return "Continue"; // Fix Text warning - always return a string
  };

  const buttonIcon = () => {
    if (strategy === "facebook") {
      return <Ionicons name="logo-facebook" size={24} color="#1977F3" />;
    } else if (strategy === "google") {
      return <Ionicons name="logo-google" size={24} color="#DB4437" />;
    } else if (strategy === "apple") {
      return <Ionicons name="logo-apple" size={24} color="black" />;
    }
  };
  const onSocialLoginPress = React.useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Starting OAuth flow for:", strategy);

      // Check network connectivity first
      const networkInfo = await checkNetworkConnectivity();
      console.log("Network status:", networkInfo);

      // if (!networkInfo.isConnected) {
      //   Alert.alert(
      //     "Network Error",
      //     "No internet connection. Please check your network settings and try again."
      //   );
      //   return;
      // }

      // if (!networkInfo.clerkApiReachable) {
      //   console.warn("Clerk API not reachable, proceeding with fallback...");
      // }

      // Use retry mechanism for OAuth flow
      const oauthResult = await retryWithBackoff(
        async () => {
          return await startOAuthFlow({
            redirectUrl: "mmaapp://callback",
          });
        },
        2,
        1500
      );

      const { createdSessionId, setActive, signIn, signUp } = oauthResult;

      console.log("OAuth flow result:", {
        createdSessionId,
        signInStatus: signIn?.status,
        signUpStatus: signUp?.status,
      });

      if (createdSessionId) {
        console.log("Session created:", createdSessionId);
        await setActive!({ session: createdSessionId });

        // Wait a bit for session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Reload user data multiple times with retries
        let retryCount = 0;
        const maxRetries = 8;
        let currentUser = user;

        while (retryCount < maxRetries && !currentUser) {
          try {
            await user?.reload();
            currentUser = user;
            console.log(
              `User reload attempt ${retryCount + 1}:`,
              currentUser?.unsafeMetadata
            );

            if (currentUser) break;

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1500));
            retryCount++;
          } catch (error) {
            console.log(
              `User reload error on attempt ${retryCount + 1}:`,
              error
            );
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }

        // Navigate based on onboarding status
        if (currentUser?.unsafeMetadata?.onboarding_completed === true) {
          console.log("User has completed onboarding, navigating to tabs");
          router.replace("/(tabs)");
        } else {
          console.log("User needs to complete onboarding");
          router.replace("/auth/complete-your-account");
        }
      } else {
        console.log("No session created, OAuth flow may need additional steps");
        console.log("SignIn status:", signIn?.status);
        console.log("SignUp status:", signUp?.status);

        // This usually means OAuth is still in progress or was cancelled
        if (signIn || signUp) {
          console.log("OAuth flow continuing with additional steps...");
          console.log("Deep link handler should process the callback...");
        }
      }
    } catch (err: any) {
      console.error("OAuth error:", err);

      // Enhanced error handling with network diagnostics
      if (err?.message?.includes("Network request failed")) {
        console.error("Network connectivity issue detected");

        const networkInfo = await checkNetworkConnectivity();
        if (!networkInfo.isConnected) {
          Alert.alert(
            "Connection Error",
            "Unable to connect to the internet. Please check your network connection and try again."
          );
        } else if (!networkInfo.clerkApiReachable) {
          Alert.alert(
            "Service Unavailable",
            "Authentication service is temporarily unavailable. Please try again in a few moments."
          );
        }
      } else if (err?.message?.includes("toString")) {
        console.error("Data parsing error - attempting retry...");
        // Attempt a single retry after a delay
        setTimeout(() => {
          // Check if component is still mounted and not currently loading
          setIsLoading(true);
          onSocialLoginPress();
        }, 2000);
        return;
      } else if (err.code === "oauth_access_denied") {
        console.log("User denied OAuth access");
        Alert.alert(
          "Access Denied",
          "You need to grant permission to continue with social login."
        );
      } else if (err.code === "oauth_callback_error") {
        console.log("OAuth callback error");
        Alert.alert(
          "Login Error",
          "There was an issue with the login process. Please try again."
        );
      } else if (err.message?.includes("redirect url")) {
        console.log("Redirect URL mismatch - check Clerk dashboard settings");
        Alert.alert(
          "Configuration Error",
          "There's a configuration issue. Please contact support."
        );
      } else {
        // Generic error fallback
        Alert.alert(
          "Login Error",
          "Something went wrong during login. Please try again or contact support if the issue persists."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow, user, router, strategy]);

  return (
    <TouchableOpacity
      style={[styles.container]}
      onPress={onSocialLoginPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        buttonIcon()
      )}
      <Text style={styles.buttonText}>{buttonText()}</Text>
      <View />
    </TouchableOpacity>
  );
};

export default SocialLoginButton;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: "gray",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "medium",
  },
});
