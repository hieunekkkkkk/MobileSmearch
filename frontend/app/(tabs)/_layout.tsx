import { Redirect, Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Search, PlusCircle, LayoutGrid } from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  // Đợi cho đến khi user data được load
  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/auth" />;
  }

  if (isSignedIn && user?.unsafeMetadata?.onboarding_completed !== true) {
    return <Redirect href="/auth/complete-your-account" />;
  }

  // Lấy role từ unsafeMetadata (được set trong complete-your-account)
  // Hoặc từ publicMetadata nếu bạn set ở đó
  const userRole = (user?.unsafeMetadata?.role as string) || "client";
  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "relative",
          },
          default: {
            height: 55,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="my-business"
        options={{
          title: "My Business",
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size} color={color} />
          ),
          // Hoàn toàn loại bỏ khỏi navigation nếu không phải owner
          href: isOwner && !isAdmin ? "/my-business" : null,
        }}
      />

      <Tabs.Screen
        name="add-business"
        options={{
          title: "Add Business",
          tabBarIcon: ({ color, size }) => (
            <PlusCircle size={size} color={color} />
          ),
          // Chỉ hiển thị cho owner, ẩn cho admin và client
          href: !isOwner && !isAdmin ? "/add-business" : null,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size} color={color} />
          ),
          href: isAdmin ? "/admin" : null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="settings-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
