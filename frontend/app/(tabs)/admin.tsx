import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Users, Building2, DollarSign, TrendingUp } from "lucide-react-native";
import { useUser } from "@clerk/clerk-expo";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";

// Types for API responses
interface Business {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: string;
  subscriptionPlanId: number;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export default function AdminScreen() {
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role as string;

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Check if user is admin
  if (userRole !== "admin") {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>
          You do not have permission to access the admin dashboard.
        </Text>
        <Text style={styles.roleText}>
          Current role: {userRole || "client"}
        </Text>
      </View>
    );
  }

  const fetchAdminData = async () => {
    try {
      console.log("🔄 Fetching admin data...");

      const usersCountResponse = await fetch(`${BE_URL}/api/clerk/users`);
      let totalUsers = 0;
      if (usersCountResponse.ok) {
        const usersData = await usersCountResponse.json();
        totalUsers = usersData.total;
        console.log("✅ Users count fetched:", totalUsers);
      } else {
        console.error("❌ Failed to fetch users count");
      }

      // Fetch businesses from backend
      const businessesResponse = await fetch(`${BE_URL}/api/businesses`);
      console.log("Business response status:", businessesResponse.status);

      let businesses = [];
      if (businessesResponse.ok) {
        businesses = await businessesResponse.json();
        console.log("✅ Businesses fetched:", businesses.length);
      } else {
        console.error(
          "❌ Failed to fetch businesses:",
          businessesResponse.status
        );
      }

      // Fetch payments from backend
      const paymentsResponse = await fetch(`${BE_URL}/api/payment/history/all`);
      console.log("Payment response status:", paymentsResponse.status);

      let payments = [];
      if (paymentsResponse.ok) {
        const paymentData = await paymentsResponse.json();
        payments = paymentData.payments || [];
        console.log("✅ Payments fetched:", payments.length);
      } else {
        console.error("❌ Failed to fetch payments:", paymentsResponse.status);
      }

      // Calculate stats
      const totalBusinesses = businesses.length;
      const totalRevenue = payments
        .filter((p: Payment) => p.status === "success")
        .reduce((sum: number, p: Payment) => sum + p.amount, 0);

      console.log("📊 Stats calculated:", {
        totalBusinesses,
        totalPayments: payments.length,
        totalRevenue,
      });

      // Calculate monthly growth
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const thisMonthPayments = payments.filter((p: Payment) => {
        const paymentDate = new Date(p.createdAt);
        return (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear &&
          p.status === "success"
        );
      });

      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const lastMonthPayments = payments.filter((p: Payment) => {
        const paymentDate = new Date(p.createdAt);
        return (
          paymentDate.getMonth() === lastMonth &&
          paymentDate.getFullYear() === lastMonthYear &&
          p.status === "success"
        );
      });

      const thisMonthRevenue = thisMonthPayments.reduce(
        (sum: number, p: Payment) => sum + p.amount,
        0
      );
      const lastMonthRevenue = lastMonthPayments.reduce(
        (sum: number, p: Payment) => sum + p.amount,
        0
      );
      const monthlyGrowth =
        lastMonthRevenue > 0
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : thisMonthRevenue > 0
          ? 100
          : 0;

      // Placeholder for total users - you would need to implement this via backend
      // Replace with actual user count from backend

      setStats({
        totalUsers,
        totalBusinesses,
        totalRevenue,
        monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
      });

      // Set recent data (sort by date first)
      const sortedBusinesses = businesses.sort(
        (a: Business, b: Business) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const sortedPayments = payments.sort(
        (a: Payment, b: Payment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecentBusinesses(sortedBusinesses.slice(0, 5));
      setRecentPayments(sortedPayments.slice(0, 5));

      console.log("✅ Admin data updated successfully");
    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const getActivityItems = () => {
    const activities: {
      type: string;
      text: string;
      time: string;
      color: string;
    }[] = [];

    // Add recent businesses
    recentBusinesses.forEach((business, index) => {
      if (index < 3) {
        activities.push({
          type: "business",
          text: `New business added: ${business.name}`,
          time: getTimeAgo(business.createdAt),
          color: Colors.primary || "#007bff",
        });
      }
    });

    // Add recent payments
    recentPayments.forEach((payment, index) => {
      if (index < 2) {
        activities.push({
          type: "payment",
          text: `Payment ${payment.status}: ${new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          }).format(payment.amount)}`,
          time: getTimeAgo(payment.createdAt),
          color:
            payment.status === "success"
              ? Colors.success || "#28a745"
              : Colors.warning || "#ffc107",
        });
      }
    });

    // Sort by time (most recent first)
    return activities
      .sort((a, b) => {
        // This is a simple sort, you might want to implement proper date comparison
        return a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary || "#007bff"} />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System overview and management</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: (Colors.primary || "#007bff") + "20" },
            ]}
          >
            <Users size={24} color={Colors.primary || "#007bff"} />
          </View>
          <Text style={styles.statValue}>
            {stats.totalUsers.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: (Colors.secondary || "#6c757d") + "20" },
            ]}
          >
            <Building2 size={24} color={Colors.secondary || "#6c757d"} />
          </View>
          <Text style={styles.statValue}>{stats.totalBusinesses}</Text>
          <Text style={styles.statLabel}>Businesses</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: (Colors.success || "#28a745") + "20" },
            ]}
          >
            <DollarSign size={24} color={Colors.success || "#28a745"} />
          </View>
          <Text style={styles.statValue}>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(stats.totalRevenue)}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              {
                backgroundColor:
                  stats.monthlyGrowth >= 0
                    ? (Colors.success || "#28a745") + "20"
                    : (Colors.danger || "#dc3545") + "20",
              },
            ]}
          >
            <TrendingUp
              size={24}
              color={
                stats.monthlyGrowth >= 0
                  ? Colors.success || "#28a745"
                  : Colors.danger || "#dc3545"
              }
            />
          </View>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  stats.monthlyGrowth >= 0
                    ? Colors.success || "#28a745"
                    : Colors.danger || "#dc3545",
              },
            ]}
          >
            {stats.monthlyGrowth >= 0 ? "+" : ""}
            {stats.monthlyGrowth}%
          </Text>
          <Text style={styles.statLabel}>Monthly Growth</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        <View style={styles.activityCard}>
          {getActivityItems().length > 0 ? (
            getActivityItems().map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityDot,
                    { backgroundColor: activity.color },
                  ]}
                />
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/ManageUsersScreen")}
          >
            <Users size={20} color={Colors.primary || "#007bff"} />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/ReviewBusinessesScreen")}
          >
            <Building2 size={20} color={Colors.secondary || "#6c757d"} />
            <Text style={styles.actionText}>Review Businesses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/FinancialReportsScreen")}
          >
            <DollarSign size={20} color={Colors.success || "#28a745"} />
            <Text style={styles.actionText}>Financial Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/AnalyticsScreen")}
          >
            <TrendingUp size={20} color={Colors.warning || "#ffc107"} />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ...existing styles...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 10,
  },
  roleText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  section: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  sectionAction: {
    fontSize: 14,
    color: "#007bff",
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: "#495057",
  },
  activityTime: {
    fontSize: 12,
    color: "#6c757d",
  },
  noActivityText: {
    textAlign: "center",
    color: "#6c757d",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#495057",
    textAlign: "center",
  },
});
