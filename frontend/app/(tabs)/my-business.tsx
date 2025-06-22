import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useBusinessStore } from "@/store/businessStore";
import { BusinessCard } from "@/components/BusinessCard";
import { Colors } from "@/constants/Colors";
import { Plus, Building2, Zap, Edit, Clock } from "lucide-react-native";
import { Business } from "@/types";
import { isBusinessOpen } from "@/utils/dateUtils";
import Toast from "react-native-toast-message";

export default function MyBusinessScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { fetchBusinessesByOwner, updateBusiness, loading, error } =
    useBusinessStore();
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Force reload user data để đảm bảo có role mới nhất từ server
  useEffect(() => {
    const checkUserRole = async () => {
      if (isLoaded && user) {
        try {
          setCheckingRole(true);
          // Force reload user data từ Clerk server
          await user.reload();
          console.log("User data reloaded:", {
            role: user.unsafeMetadata?.role,
            subscription: user.unsafeMetadata?.subscription,
          });
        } catch (error) {
          console.error("Failed to reload user data:", error);
        } finally {
          setCheckingRole(false);
        }
      } else {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [isLoaded, user?.id]);

  // Get real-time role từ Clerk (không cache)
  const userRole = user?.unsafeMetadata?.role as string;
  const subscription = user?.unsafeMetadata?.subscription as
    | { id?: number }
    | undefined;
  const currentSubscriptionId = subscription?.id;
  const canManageBusinesses = userRole === "owner" || userRole === "admin";

  const fetchMyBusinesses = async () => {
    if (user?.id && canManageBusinesses) {
      try {
        await fetchBusinessesByOwner(user.id);
        // Get businesses from store after fetching
        const { businesses } = useBusinessStore.getState();
        setMyBusinesses(businesses);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
        setMyBusinesses([]);
      }
    }
  };

  useEffect(() => {
    // Chỉ fetch businesses khi đã check xong role và user có quyền
    if (!checkingRole && canManageBusinesses) {
      fetchMyBusinesses();
    }
  }, [user?.id, canManageBusinesses, checkingRole]);

  const handleRefresh = async () => {
    setRefreshing(true);

    // Reload user data trước khi fetch businesses
    if (user) {
      try {
        await user.reload();
      } catch (error) {
        console.error("Failed to reload user during refresh:", error);
      }
    }

    // Chỉ fetch nếu user có quyền
    if (canManageBusinesses) {
      await fetchMyBusinesses();
    }

    setRefreshing(false);
  };

  const handleToggleBusinessStatus = async (
    business: Business,
    newStatus: boolean
  ) => {
    // Double check role trước khi thực hiện action
    if (!canManageBusinesses) {
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "You don't have permission to manage businesses",
        position: "top",
      });
      return;
    }

    try {
      // Check if business should be open based on current time and opening hours
      const shouldBeOpen = business.openingHours
        ? isBusinessOpen(
            business.openingHours.open,
            business.openingHours.close,
            business.openingHours.days
          )
        : true;

      // If trying to open but outside opening hours, show warning
      if (newStatus && !shouldBeOpen) {
        Toast.show({
          type: "info",
          text1: "Outside Opening Hours",
          text2: "Business is currently outside operating hours",
          position: "top",
          visibilityTime: 3000,
        });
      }

      // Update business status
      await updateBusiness(business.id, { isOpen: newStatus });

      // Update local state
      setMyBusinesses((prev) =>
        prev.map((b) =>
          b.id === business.id ? { ...b, isOpen: newStatus } : b
        )
      );

      Toast.show({
        type: "success",
        text1: `Business ${newStatus ? "Opened" : "Closed"}`,
        text2: `${business.name} is now ${newStatus ? "open" : "closed"}`,
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not update business status",
        position: "top",
      });
    }
  };

  const handleEditBusiness = (business: Business) => {
    // Double check role trước khi navigate
    if (!canManageBusinesses) {
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "You don't have permission to edit businesses",
        position: "top",
      });
      return;
    }

    // Navigate to add-business with edit mode
    router.push({
      pathname: "/(tabs)/add-business",
      params: { editId: business.id },
    });
  };

  const renderBusinessCard = (business: Business) => {
    const shouldBeOpen = business.openingHours
      ? isBusinessOpen(
          business.openingHours.open,
          business.openingHours.close,
          business.openingHours.days
        )
      : true;

    return (
      <View key={business.id} style={styles.businessContainer}>
        <BusinessCard
          business={business}
          onPress={() => router.push(`/business/${business.id}`)}
        />

        <View style={styles.businessControls}>
          <View style={styles.statusContainer}>
            <View style={styles.statusInfo}>
              <Clock
                size={16}
                color={shouldBeOpen ? Colors.success : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: shouldBeOpen ? Colors.success : Colors.textSecondary,
                  },
                ]}
              >
                {shouldBeOpen ? "In Hours" : "Out of Hours"}
              </Text>
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {business.isOpen ? "Open" : "Closed"}
              </Text>
              <Switch
                value={business.isOpen}
                onValueChange={(value) =>
                  handleToggleBusinessStatus(business, value)
                }
                trackColor={{
                  false: Colors.textSecondary + "30",
                  true: Colors.success + "50",
                }}
                thumbColor={
                  business.isOpen ? Colors.success : Colors.textSecondary
                }
                ios_backgroundColor={Colors.textSecondary + "30"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditBusiness(business)}
          >
            <Edit size={16} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show loading while checking role
  if (!isLoaded || checkingRole) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen
          options={{
            title: "My Businesses",
            headerBackTitle: "Back",
          }}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  // Redirect to subscription if user is not owner/admin
  if (!canManageBusinesses) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen
          options={{
            title: "My Businesses",
            headerBackTitle: "Back",
          }}
        />

        <Building2 size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Access Restricted</Text>
        <Text style={styles.emptySubtitle}>
          Only business owners can access this section.
        </Text>
        <Text style={styles.currentRoleText}>
          Current role:{" "}
          <Text style={styles.roleHighlight}>{userRole || "client"}</Text>
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push("/subcription")}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Owner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Businesses",
          headerBackTitle: "Back",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/add-business")}
              style={styles.addButton}
            >
              <Plus size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {user && (
          <View style={styles.header}>
            <Text style={styles.title}>My Businesses</Text>
            <Text style={styles.subtitle}>
              Managing as:{" "}
              {user.fullName || user.emailAddresses[0]?.emailAddress}
            </Text>

            {/* Role info để debug */}
            <Text style={styles.roleInfo}>
              Role: <Text style={styles.roleHighlight}>{userRole}</Text>
              {currentSubscriptionId && (
                <Text>
                  {" "}
                  | Plan:{" "}
                  <Text style={styles.planHighlight}>
                    {currentSubscriptionId}
                  </Text>
                </Text>
              )}
            </Text>

            {/* Current Subscription Info */}
            {currentSubscriptionId && (
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionText}>
                  Subscription ID:{" "}
                  <Text style={styles.subscriptionId}>
                    {currentSubscriptionId}
                  </Text>
                </Text>
              </View>
            )}

            {/* Upgrade Business Button */}
            <TouchableOpacity
              style={styles.upgradeBusinessButton}
              onPress={() => router.push("/subcription")}
            >
              <Zap size={18} color={Colors.white} />
              <Text style={styles.upgradeBusinessText}>
                Upgrade Business Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={fetchMyBusinesses}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!Array.isArray(myBusinesses) || myBusinesses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Building2 size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Businesses Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding your first business to get discovered by
              customers.
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => router.push("/(tabs)/add-business")}
            >
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addFirstButtonText}>
                Add Your First Business
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.businessList}>
            {myBusinesses.map(renderBusinessCard)}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // New loading styles
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  // Role info styles
  roleInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  roleHighlight: {
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "capitalize",
  },
  planHighlight: {
    fontWeight: "600",
    color: Colors.success,
  },
  currentRoleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  addButton: {
    marginRight: 16,
  },
  subscriptionInfo: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  subscriptionId: {
    fontWeight: "600",
    color: Colors.primary,
  },
  upgradeBusinessButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  upgradeBusinessText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: Colors.error + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + "20",
    alignItems: "center",
  },
  errorText: {
    color: Colors.error,
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFirstButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  businessList: {
    padding: 20,
    gap: 16,
  },
  // Business controls styles
  businessContainer: {
    marginBottom: 16,
  },
  businessControls: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flex: 1,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
