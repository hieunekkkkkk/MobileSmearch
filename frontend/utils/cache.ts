import * as SecureStore from "expo-secure-store";
import { Platform, Alert } from "react-native";

const createTokenCache = () => {
  return {
    getToken: async (key: string) => {
      try {
        if (Platform.OS === "web") {
          return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error("Error getting token:", error);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        if (Platform.OS === "web") {
          localStorage.setItem(key, token);
        } else {
          await SecureStore.setItemAsync(key, token);
        }
      } catch (error) {
        console.error("Error saving token:", error);
      }
    },
    clearToken: async (key: string) => {
      try {
        if (Platform.OS === "web") {
          localStorage.removeItem(key);
        } else {
          await SecureStore.deleteItemAsync(key);
        }
      } catch (error) {
        console.error("Error clearing token:", error);
      }
    },
    clearAllTokens: async () => {
      try {
        if (Platform.OS === "web") {
          // Clear all Clerk-related items and other relevant localStorage keys
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("__clerk") || key.includes("auth"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
          // Optionally clear all localStorage if safe
          localStorage.clear(); // Cẩn thận khi dùng, có thể ảnh hưởng dữ liệu khác
        } else {
          // Clear Clerk-related keys from SecureStore
          const clerkKeys = [
            "__clerk_client_jwt",
            "__clerk_session_token",
            "__clerk_refresh_token",
            "__clerk_user",
            "__clerk_session",
          ];
          for (const key of clerkKeys) {
            try {
              await SecureStore.deleteItemAsync(key);
            } catch (error) {
              // Key might not exist, continue
            }
          }
        }
        // Clear cookies if applicable (web)
        if (Platform.OS === "web") {
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(
                /=.*/,
                "=;expires=" + new Date().toUTCString() + ";path=/"
              );
          });
        }
      } catch (error) {
        console.error("Error clearing all tokens:", error);
      }
    },
  };
};

export const tokenCache = createTokenCache();
