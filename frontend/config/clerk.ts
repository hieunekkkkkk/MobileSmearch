/**
 * Clerk Configuration
 * Handles fallback between custom domain and default Clerk endpoints
 */

export const clerkConfig = {
  // Primary configuration with custom domain
  primary: {
    frontendApi: "clerk.mobile.smearch.io.vn",
    apiUrl: "https://clerk.mobile.smearch.io.vn",
  },

  // Fallback configuration using default Clerk endpoints
  fallback: {
    frontendApi: undefined, // Will use default
    apiUrl: undefined, // Will use default
  },

  // Common settings
  common: {
    signInUrl: "/auth",
    signUpUrl: "/auth",
    afterSignInUrl: "/(tabs)",
    afterSignUpUrl: "/auth/complete-your-account",
  },
};

/**
 * Test if custom domain is reachable
 */
export const testClerkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${clerkConfig.primary.apiUrl}/v1/client`, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("Custom Clerk domain not reachable:", error);
    return false;
  }
};

/**
 * Get optimal Clerk configuration based on connectivity
 */
export const getClerkOptions = async () => {
  const isCustomDomainReachable = await testClerkConnectivity();

  if (isCustomDomainReachable) {
    console.log("Using custom Clerk domain");
    return {
      ...clerkConfig.primary,
      ...clerkConfig.common,
    };
  } else {
    console.log("Falling back to default Clerk endpoints");
    return clerkConfig.common;
  }
};
