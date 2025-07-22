/**
 * Network Utilities for debugging connectivity issues
 */

export interface NetworkInfo {
  isConnected: boolean;
  connectionType?: string;
  clerkApiReachable: boolean;
  backendReachable: boolean;
}

/**
 * Check overall network connectivity
 */
export const checkNetworkConnectivity = async (): Promise<NetworkInfo> => {
  const result: NetworkInfo = {
    isConnected: false,
    clerkApiReachable: false,
    backendReachable: false,
  };

  try {
    // Test basic connectivity with a reliable endpoint
    const basicConnectivity = await fetch("https://www.google.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });

    result.isConnected = basicConnectivity.ok;
  } catch (error) {
    console.warn("Basic connectivity test failed:", error);
  }

  if (result.isConnected) {
    // Test Clerk API reachability
    try {
      const clerkResponse = await fetch(
        "https://clerk.mobile.smearch.io.vn/v1/client",
        {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        }
      );
      result.clerkApiReachable = clerkResponse.ok;
    } catch (error) {
      console.warn("Clerk API not reachable:", error);
    }

    // Test backend reachability (if you have a backend endpoint)
    try {
      // Update with your actual backend URL
      const backendResponse = await fetch(
        "https://your-backend-url.com/health",
        {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        }
      );
      result.backendReachable = backendResponse.ok;
    } catch (error) {
      console.warn("Backend not reachable:", error);
    }
  }

  return result;
};

/**
 * Debug network issues and provide suggestions
 */
export const debugNetworkIssues = async (): Promise<string[]> => {
  const suggestions: string[] = [];
  const networkInfo = await checkNetworkConnectivity();

  if (!networkInfo.isConnected) {
    suggestions.push(
      "No internet connection detected. Please check your network settings."
    );
    return suggestions;
  }

  if (!networkInfo.clerkApiReachable) {
    suggestions.push("Clerk API is not reachable. This could be due to:");
    suggestions.push("- Custom domain configuration issues");
    suggestions.push("- DNS resolution problems");
    suggestions.push("- Firewall blocking the request");
    suggestions.push("- Clerk service temporarily unavailable");
  }

  if (!networkInfo.backendReachable) {
    suggestions.push(
      "Backend API is not reachable. Check if your server is running."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Network connectivity appears normal. Issue might be temporary."
    );
  }

  return suggestions;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};
