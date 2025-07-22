import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect, Stack, usePathname } from "expo-router";

export default function AuthLayout() {
  const { user, isLoaded } = useUser();
  const pathName = usePathname();
  const { isSignedIn } = useAuth();

  console.log("Auth Layout - isSignedIn:", isSignedIn);
  console.log("Auth Layout - pathName:", pathName);
  console.log("Auth Layout - user loaded:", isLoaded);
  console.log(
    "Auth Layout - onboarding_completed:",
    user?.unsafeMetadata?.onboarding_completed
  );

  // Wait for user data to load
  if (!isLoaded) {
    return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="complete-your-account"
          options={{ headerShown: false }}
        />
      </Stack>
    );
  }

  // If user is signed in and has completed onboarding, redirect to tabs
  if (isSignedIn && user?.unsafeMetadata?.onboarding_completed === true) {
    return <Redirect href="/(tabs)" />;
  }

  // If user is signed in but hasn't completed onboarding, ensure they're on the right page
  if (isSignedIn && user?.unsafeMetadata?.onboarding_completed !== true) {
    if (pathName !== "/auth/complete-your-account") {
      return <Redirect href="/auth/complete-your-account" />;
    }
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="complete-your-account"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
