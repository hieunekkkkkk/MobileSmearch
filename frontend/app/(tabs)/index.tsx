import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useBusinessStore } from "@/store/businessStore";
import { BusinessCard } from "@/components/BusinessCard";
import { CategoryButton } from "@/components/CategoryButton";
import { SearchBar } from "@/components/SearchBar";
import { Business, BusinessCategory } from "@/types";
import { Colors } from "@/constants/Colors";
import { useFocusEffect } from "@react-navigation/native";

const categories = [
  { id: "accommodation", label: "Hostels" },
  { id: "hotel", label: "Hotels" },
  { id: "restaurant", label: "Restaurants" },
  { id: "pharmacy", label: "Pharmacies" },
  { id: "gas_station", label: "Gas Stations" },
];

export default function HomeScreen() {
  const router = useRouter();
  const {
    filteredBusinesses,
    loading,
    error,
    selectedCategory,
    searchQuery,
    fetchBusinesses,
    fetchBusinessesByCategory,
    setSelectedCategory,
    searchBusinesses,
    clearError,
  } = useBusinessStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial data fetch
    fetchBusinesses();
  }, [fetchBusinesses]);

  useFocusEffect(
    useCallback(() => {
      console.log("HomeScreen focused - refreshing data");
      fetchBusinesses();
      // Reset any filters or search state if needed
      setLocalSearchQuery("");
      setSelectedCategory(null);
    }, [])
  );

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleCategoryPress = async (category: BusinessCategory) => {
    if (selectedCategory === category) {
      // If same category is selected, clear filter and show all businesses
      setSelectedCategory(null);
      await fetchBusinesses();
    } else {
      // Fetch businesses for the selected category
      await fetchBusinessesByCategory(category);
    }
  };

  const handleBusinessPress = (business: Business) => {
    router.push(`/business/${business.id}`);
  };

  const handleSearch = async (text: string) => {
    setLocalSearchQuery(text);
    await searchBusinesses(text);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      clearError();
      if (selectedCategory) {
        await fetchBusinessesByCategory(selectedCategory);
      } else if (searchQuery) {
        await searchBusinesses(searchQuery);
      } else {
        await fetchBusinesses();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Find Places</Text>
        <Text style={styles.subtitle}>Discover businesses around you</Text>
        {error && (
          <TouchableOpacity
            style={styles.errorContainer}
            onPress={() => {
              clearError();
              handleRefresh();
            }}
          >
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={localSearchQuery}
          onChangeText={handleSearch}
          placeholder="Search for businesses..."
        />
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category.id as BusinessCategory}
              label={category.label}
              isSelected={selectedCategory === category.id}
              onPress={() =>
                handleCategoryPress(category.id as BusinessCategory)
              }
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.businessesHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? `${categories.find((c) => c.id === selectedCategory)?.label}`
            : searchQuery
            ? ``
            : "Popular Places"}
        </Text>
        {loading && !refreshing && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
      </View>
    </>
  );

  const renderBusinessItem = ({ item }: { item: Business }) => (
    <BusinessCard business={item} onPress={handleBusinessPress} />
  );

  const renderEmptyState = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Unable to load businesses</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredBusinesses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No businesses found for "${searchQuery}"`
              : selectedCategory
              ? `No ${categories
                  .find((c) => c.id === selectedCategory)
                  ?.label?.toLowerCase()} found`
              : "No businesses available"}
          </Text>
          {(searchQuery || selectedCategory) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setLocalSearchQuery("");
                setSelectedCategory(null);
                fetchBusinesses();
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item.id}
        renderItem={renderBusinessItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: "#fee",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: {
    color: "#c44",
    fontSize: 14,
    fontWeight: "500",
  },
  retryText: {
    color: "#c44",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  categoriesList: {
    paddingRight: 20,
  },
  businessesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  clearFiltersButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
});
