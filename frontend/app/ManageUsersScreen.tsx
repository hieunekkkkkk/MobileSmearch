import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { ArrowLeft, User, Crown, Shield } from "lucide-react-native";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  role: string;
  gender: string;
  createdAt: string;
  lastSignInAt: string;
  imageUrl: string;
}

const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    owners: 0,
    clients: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BE_URL}/api/clerk/users?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);

        // Calculate stats
        const admins = data.users.filter(
          (u: User) => u.role === "admin"
        ).length;
        const owners = data.users.filter(
          (u: User) => u.role === "owner"
        ).length;
        const clients = data.users.filter(
          (u: User) => u.role === "client"
        ).length;

        setStats({
          total: data.total,
          admins,
          owners,
          clients,
        });
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserPress = (user: User) => {
    Alert.alert(
      "User Details",
      `Name: ${user.fullName}\nEmail: ${user.email}\nRole: ${
        user.role
      }\nUsername: ${user.username || "N/A"}\nGender: ${user.gender || "N/A"}`,
      [{ text: "OK" }]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield size={14} color={Colors.danger || "#dc3545"} />;
      case "owner":
        return <Crown size={14} color={Colors.primary || "#007bff"} />;
      default:
        return <User size={14} color={Colors.secondary || "#6c757d"} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return Colors.danger || "#dc3545";
      case "owner":
        return Colors.primary || "#007bff";
      default:
        return Colors.secondary || "#6c757d";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary || "#007bff"} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Manage Users",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={Colors.primary || "#007bff"} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#f8f9fa",
          },
          headerTitleStyle: {
            color: "#212529",
            fontWeight: "bold",
          },
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.danger }]}>
                {stats.admins}
              </Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {stats.owners}
              </Text>
              <Text style={styles.statLabel}>Owners</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.secondary }]}>
                {stats.clients}
              </Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
          </View>
        </View>

        {/* Simple user list */}
        <View style={styles.usersList}>
          {users.map((user, index) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userItem}
              onPress={() => handleUserPress(user)}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userMeta}>
                  @{user.username || user.id.slice(0, 8)} •{" "}
                  {user.gender || "N/A"}
                </Text>
              </View>

              <View style={styles.userRole}>
                {getRoleIcon(user.role)}
                <Text
                  style={[styles.roleText, { color: getRoleColor(user.role) }]}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  usersList: {
    padding: 20,
  },
  userItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  userEmail: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  userMeta: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  userRole: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
