import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Table } from "@/components/Table";
import { Colors } from "@/constants/Colors";
import { Trash2, ArrowLeft } from "lucide-react-native";

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  ownerId: string;
  rating: number;
  viewCount: number;
  createdAt: string;
}
const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export default function ReviewBusinessesScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${BE_URL}/api/businesses`);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = (business: Business) => {
    Alert.alert(
      "Delete Business",
      `Are you sure you want to delete "${business.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${BE_URL}/api/businesses/${business.id}`,
                {
                  method: "DELETE",
                }
              );

              if (response.ok) {
                setBusinesses((prev) =>
                  prev.filter((b) => b.id !== business.id)
                );
                Alert.alert("Success", "Business deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete business");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred");
            }
          },
        },
      ]
    );
  };

  const columns = [
    { key: "name", title: "Business Name", width: 180 },
    { key: "category", title: "Category", width: 120 },
    { key: "address", title: "Address", width: 200 },
    {
      key: "rating",
      title: "Rating",
      width: 80,
      render: (value: number) => (
        <Text style={styles.ratingText}>{value?.toFixed(1) || "0.0"}</Text>
      ),
    },
    { key: "viewCount", title: "Views", width: 80 },
    {
      key: "createdAt",
      title: "Created",
      width: 100,
      render: (value: string) => (
        <Text>{new Date(value).toLocaleDateString()}</Text>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 80,
      render: (_: any, row: Business) => (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBusiness(row)}
        >
          <Trash2 size={16} color={Colors.danger || "#dc3545"} />
        </TouchableOpacity>
      ),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading businesses...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Businesses",
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
          <Text style={styles.title}>Business Review</Text>
          <Text style={styles.subtitle}>
            Total businesses: {businesses.length}
          </Text>
        </View>

        <ScrollView style={styles.tableContainer}>
          <Table columns={columns} data={businesses} />
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
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  tableContainer: {
    flex: 1,
    padding: 20,
  },
  ratingText: {
    color: Colors.warning || "#ffc107",
    fontWeight: "600",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#fff5f5",
    alignItems: "center",
    justifyContent: "center",
  },
});
