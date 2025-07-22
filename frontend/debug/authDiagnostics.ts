/**
 * Debug script to test Clerk connectivity and OAuth setup
 * Run this to diagnose authentication issues
 */

import { checkNetworkConnectivity, debugNetworkIssues } from "../utils/network";
import { testClerkConnectivity } from "../config/clerk";

export const runAuthenticationDiagnostics = async () => {
  console.log("🔍 Running authentication diagnostics...\n");

  // Test 1: Basic network connectivity
  console.log("1. Testing network connectivity...");
  const networkInfo = await checkNetworkConnectivity();
  console.log("   ✓ Internet connected:", networkInfo.isConnected);
  console.log("   ✓ Clerk API reachable:", networkInfo.clerkApiReachable);
  console.log("   ✓ Backend reachable:", networkInfo.backendReachable);

  // Test 2: Clerk-specific connectivity
  console.log("\n2. Testing Clerk custom domain...");
  const clerkReachable = await testClerkConnectivity();
  console.log(
    "   ✓ Custom Clerk domain:",
    clerkReachable ? "✅ Working" : "❌ Failed"
  );

  // Test 3: Get network suggestions
  console.log("\n3. Network diagnostics:");
  const suggestions = await debugNetworkIssues();
  suggestions.forEach((suggestion) => {
    console.log(`   • ${suggestion}`);
  });

  // Test 4: Environment variables
  console.log("\n4. Checking environment variables...");
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  console.log(
    "   ✓ Clerk publishable key:",
    clerkKey ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "   ✓ Key format:",
    clerkKey?.startsWith("pk_") ? "✅ Valid" : "❌ Invalid"
  );

  // Test 5: Deep link configuration
  console.log("\n5. Deep link configuration:");
  console.log("   ✓ OAuth redirect URL: mmaapp://callback");
  console.log("   ✓ App scheme: mmaapp");

  console.log("\n🎯 Diagnostics complete!");

  return {
    networkConnected: networkInfo.isConnected,
    clerkApiReachable: networkInfo.clerkApiReachable,
    customDomainWorking: clerkReachable,
    environmentConfigured: !!clerkKey,
    suggestions,
  };
};

// Usage example:
// import { runAuthenticationDiagnostics } from './path/to/this/file';
// runAuthenticationDiagnostics().then(result => console.log(result));
