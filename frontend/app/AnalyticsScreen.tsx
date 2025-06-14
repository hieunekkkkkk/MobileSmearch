import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LineChart } from "@/components/LineChart";
import { Colors } from "@/constants/Colors";
import { ArrowLeft } from "lucide-react-native";

interface ChartData {
  month: string;
  revenue: number;
}
const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export default function AnalyticsScreen() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`${BE_URL}/api/payment/history/all`);
      if (response.ok) {
        const data = await response.json();
        const payments = data.payments || [];

        // Group payments by month and calculate revenue
        const monthlyRevenue: { [key: string]: number } = {};

        payments.forEach((payment: any) => {
          if (payment.status === "success") {
            const date = new Date(payment.createdAt);
            const monthKey = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;
            const monthName = date.toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            });

            if (!monthlyRevenue[monthName]) {
              monthlyRevenue[monthName] = 0;
            }
            monthlyRevenue[monthName] += payment.amount;
          }
        });

        // Convert to chart data format
        const chartData = Object.entries(monthlyRevenue)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => {
            // Sort by date
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(-12); // Last 12 months

        setChartData(chartData);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Analytics",
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
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Revenue Analytics</Text>
          <Text style={styles.subtitle}>Monthly revenue trends</Text>
        </View>

        <LineChart data={chartData} title="Monthly Revenue (VND)" />

        {/* Additional stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{chartData.length}</Text>
            <Text style={styles.statLabel}>Months with Revenue</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {chartData.length > 0
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(Math.max(...chartData.map((d) => d.revenue)))
                : "0"}
            </Text>
            <Text style={styles.statLabel}>Highest Month</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {chartData.length > 0
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(
                    chartData.reduce((sum, d) => sum + d.revenue, 0) /
                      chartData.length
                  )
                : "0"}
            </Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
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
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
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
    textAlign: "center",
  },
});
