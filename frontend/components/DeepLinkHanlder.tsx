import { useEffect, useCallback } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";

export function DeepLinkHandler() {
  const router = useRouter();
  const { user } = useUser();

  const handleDeepLink = useCallback(
    async (url: string) => {
      console.log("Deep link received:", url);

      if (url.includes("mmaapp://callback")) {
        // Handle OAuth callback - Clerk sẽ tự động xử lý
        console.log("OAuth callback received");
        // Không cần làm gì thêm, Clerk sẽ handle
      } else if (url.includes("mmaapp://payment-success")) {
        // Handle successful payment - navigate to my-business
        Toast.show({
          type: "success",
          text1: "🎉 Payment Successful!",
          text2: "Your subscription is now active!",
          position: "top",
          visibilityTime: 3000,
        });

        // Navigate to my-business tab
        router.push("/(tabs)/my-business");
      } else if (url.includes("mmaapp://payment-cancel")) {
        // Handle cancelled/failed payment
        console.log("Payment failed/cancelled - reverting user role to client");

        // Revert user role back to client
        if (user) {
          try {
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                role: "client",
                subscription: null, // Clear subscription
              },
            });
            await user.reload();

            console.log("User role reverted to client successfully");
          } catch (error) {
            console.error("Failed to revert user role:", error);
          }
        }

        Toast.show({
          type: "error",
          text1: "❌ Payment Failed",
          text2:
            "Your payment was cancelled or failed. Role reverted to client.",
          position: "top",
          visibilityTime: 4000,
        });

        // Navigate back to subscription page
        router.push("/subcription");
      }
    },
    [router, user]
  );

  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle deep links when app is already running
    const handleUrlChange = (url: string) => {
      handleDeepLink(url);
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrlChange(url);
    });

    getInitialURL();

    return () => {
      subscription?.remove();
    };
  }, [handleDeepLink]);

  return null; // This component doesn't render anything
}
