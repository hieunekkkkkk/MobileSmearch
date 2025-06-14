import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Table } from "@/components/Table";
import { Colors } from "@/constants/Colors";
import { ArrowLeft } from "lucide-react-native";

interface Payment {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: string;
  subscriptionPlanId: number;
  createdAt: string;
}
const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export default function FinancialReportsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${BE_URL}/api/payment/history/all`);
      if (response.ok) {
        const data = await response.json();
        const paymentsData = data.payments || [];
        setPayments(paymentsData);

        // Calculate stats
        const totalRevenue = paymentsData
          .filter((p: Payment) => p.status === "success")
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);

        const successfulPayments = paymentsData.filter(
          (p: Payment) => p.status === "success"
        ).length;
        const failedPayments = paymentsData.filter(
          (p: Payment) => p.status === "failed"
        ).length;

        setStats({
          totalRevenue,
          successfulPayments,
          failedPayments,
        });
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "orderId", title: "Order ID", width: 150 },
    { key: "userId", title: "User ID", width: 100 },
    {
      key: "amount",
      title: "Amount",
      width: 120,
      render: (value: number) => (
        <Text style={styles.amountText}>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          }).format(value)}
        </Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: 100,
      render: (value: string) => (
        <View
          style={[styles.statusTag, { backgroundColor: getStatusColor(value) }]}
        >
          <Text style={styles.statusText}>{value}</Text>
        </View>
      ),
    },
    { key: "subscriptionPlanId", title: "Plan", width: 80 },
    {
      key: "createdAt",
      title: "Date",
      width: 120,
      render: (value: string) => (
        <Text>{new Date(value).toLocaleDateString()}</Text>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return Colors.success || "#28a745";
      case "failed":
        return Colors.danger || "#dc3545";
      default:
        return Colors.warning || "#ffc107";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading financial data...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Financial",
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Reports</Text>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(stats.totalRevenue)}
              </Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {stats.successfulPayments}
              </Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.danger }]}>
                {stats.failedPayments}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.tableContainer}>
          <Table columns={columns} data={payments} />
        </ScrollView>
      </View>
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
  tableContainer: {
    flex: 1,
    padding: 20,
  },
  amountText: {
    fontWeight: "600",
    color: Colors.primary || "#007bff",
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});
