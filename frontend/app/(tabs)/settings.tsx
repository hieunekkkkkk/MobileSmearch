import { SignedIn, useClerk, useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { tokenCache } from "@/utils/cache";

const SettingsScreen = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: performSignOut,
      },
    ]);
  };

  const performSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Clear all tokens first
      await tokenCache.clearAllTokens();

      // Sign out from Clerk
      await signOut();

      // Additional cleanup if needed
      // Clear any app-specific storage

      // Force navigation to auth screen
      router.replace("/auth");
    } catch (error) {
      Alert.alert("Success", "You are successfully signed out.");
    } finally {
      setIsSigningOut(false);
    }
  };

  // If user is not signed in, redirect immediately
  if (!isSignedIn) {
    router.replace("/auth");
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <SignedIn>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>
              {user?.emailAddresses[0]?.emailAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{user?.fullName || "Not set"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{user?.username || "Not set"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>
              {(user?.unsafeMetadata?.role as string) || "client"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>
              {(user?.unsafeMetadata?.gender as string) || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Joined:</Text>
            <Text style={styles.value}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.signOutButton,
            isSigningOut && styles.signOutButtonDisabled,
          ]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </SignedIn>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  signOutButton: {
    backgroundColor: "#ff4444",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  signOutButtonDisabled: {
    backgroundColor: "#ff4444aa",
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
