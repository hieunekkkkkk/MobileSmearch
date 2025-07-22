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

      if (url.includes("mmaapp://callback") || url.includes("oauth")) {
        console.log("OAuth callback received, waiting for user session...");

        // Wait for user session to be established
        let retryCount = 0;
        const maxRetries = 15;

        const checkUserSession = async () => {
          while (retryCount < maxRetries) {
            try {
              if (user) {
                await user.reload();
                console.log(`User session check ${retryCount + 1}:`, {
                  userId: user.id,
                  onboarding: user.unsafeMetadata?.onboarding_completed,
                });

                // Navigate based on onboarding status
                if (user.unsafeMetadata?.onboarding_completed === true) {
                  console.log(
                    "OAuth: User completed onboarding, going to tabs"
                  );
                  router.replace("/(tabs)");
                } else {
                  console.log("OAuth: User needs to complete onboarding");
                  router.replace("/auth/complete-your-account");
                }
                return;
              }

              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, 1500));
            } catch (error) {
              console.log(`OAuth callback retry ${retryCount + 1}:`, error);
              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          console.log(
            "OAuth callback: Could not establish user session after retries"
          );
        };

        // Start checking for user session
        checkUserSession();
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
