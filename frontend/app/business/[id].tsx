import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { useUser } from "@clerk/clerk-expo";
import { useBusinessStore } from "@/store/businessStore";
import { Colors } from "@/constants/Colors";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Navigation,
  Share2,
  ArrowLeft,
} from "lucide-react-native";
import { BusinessStatusBadge } from "@/components/BusinessStatusBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatOpeningHours } from "@/utils/dateUtils";
import { openInMaps, getDirections } from "@/utils/mapUtils";
import { Button } from "@/components/Button";

const { width } = Dimensions.get("window");
const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const {
    fetchBusinessById,
    selectedBusiness,
    loading,
    error,
    clearError,
    clearSelectedBusiness,
  } = useBusinessStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [businessRatings, setBusinessRatings] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      clearSelectedBusiness();
      fetchBusinessById(id);
      fetchBusinessRatings();
    }

    return () => {
      clearSelectedBusiness();
    };
  }, [id]);

  const fetchBusinessRatings = async () => {
    if (!id) return;

    try {
      const response = await fetch(`${BE_URL}/api/businesses/${id}/ratings`);
      if (response.ok) {
        const ratings = await response.json();
        setBusinessRatings(Array.isArray(ratings) ? ratings : []);
      }
    } catch (error) {
      console.error("Error fetching business ratings:", error);
      setBusinessRatings([]);
    }
  };

  const handleRatingPress = async (rating: number) => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to rate this business", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth") },
      ]);
      return;
    }

    if (submittingRating) return;

    Alert.alert(
      "Rate Business",
      `You want to give ${rating} star${rating > 1 ? "s" : ""} to ${
        selectedBusiness?.name
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => submitRating(rating),
        },
      ]
    );
  };

  const submitRating = async (rating: number) => {
    if (!id || !selectedBusiness) return;

    setSubmittingRating(true);
    try {
      const response = await fetch(`${BE_URL}/api/businesses/${id}/ratings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setUserRating(rating);

        // Update business rating in store
        if (selectedBusiness) {
          selectedBusiness.rating = data.rating;
        }

        // Refresh business data to get updated rating
        await fetchBusinessById(id);
        await fetchBusinessRatings();

        Alert.alert(
          "Thank You!",
          `You rated ${selectedBusiness.name} with ${rating} star${
            rating > 1 ? "s" : ""
          }.\nNew average rating: ${data.rating.toFixed(1)}/5`,
          [{ text: "OK" }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setSubmittingRating(false);
      setHoveredRating(0);
    }
  };

  const renderStarRating = (
    currentRating: number,
    interactive: boolean = false
  ) => {
    const displayRating = interactive
      ? hoveredRating || userRating
      : currentRating;

    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= displayRating;

          if (interactive) {
            return (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => handleRatingPress(star)}
                onPressIn={() => setHoveredRating(star)}
                onPressOut={() => setHoveredRating(0)}
                disabled={submittingRating}
              >
                <Star
                  size={32}
                  color={isActive ? Colors.secondary : Colors.gray}
                  fill={isActive ? Colors.secondary : "transparent"}
                />
              </TouchableOpacity>
            );
          }

          return (
            <Star
              key={star}
              size={18}
              color={isActive ? Colors.secondary : Colors.gray}
              fill={isActive ? Colors.secondary : "transparent"}
              style={styles.displayStar}
            />
          );
        })}
      </View>
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleOpenMaps = () => {
    if (selectedBusiness) {
      openInMaps(
        selectedBusiness.location.latitude,
        selectedBusiness.location.longitude,
        selectedBusiness.name
      );
    }
  };

  const handleGetDirections = () => {
    if (selectedBusiness) {
      getDirections(
        selectedBusiness.location.latitude,
        selectedBusiness.location.longitude,
        selectedBusiness.name
      );
    }
  };

  const handleShare = async () => {
    if (selectedBusiness) {
      try {
        const message = `Check out ${selectedBusiness.name} - ${selectedBusiness.description}`;
        Alert.alert("Share", message);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  const handleRetry = () => {
    if (id) {
      clearError();
      fetchBusinessById(id);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Error",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load business</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Try Again"
            onPress={handleRetry}
            style={styles.retryButton}
          />
          <Button
            title="Go Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </>
    );
  }

  // No business found
  if (!selectedBusiness) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Not Found",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Business not found</Text>
          <Text style={styles.errorText}>
            The business you are looking for does not exist or has been removed.
          </Text>
          <Button
            title="Go Back"
            onPress={handleBack}
            style={styles.backButton}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: selectedBusiness.name,
          headerBackTitle: "Back",
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setActiveImageIndex(newIndex);
            }}
          >
            {selectedBusiness.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
                contentFit="cover"
                placeholder="https://via.placeholder.com/400x250?text=Loading..."
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {selectedBusiness.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {selectedBusiness.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === activeImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}

          <View style={styles.categoryIconContainer}>
            <CategoryIcon category={selectedBusiness.category} size={50} />
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <Text style={styles.name}>{selectedBusiness.name}</Text>
            <BusinessStatusBadge isOpen={selectedBusiness.isOpen} />
          </View>

          {/* Current Rating Display */}
          <View style={styles.ratingContainer}>
            {renderStarRating(selectedBusiness.rating || 0, false)}
            <Text style={styles.rating}>
              {selectedBusiness.rating?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.viewCount}>
              ({selectedBusiness.viewCount || 0} views)
            </Text>
            <Text style={styles.totalRatings}>
              • {businessRatings.length} review
              {businessRatings.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Interactive Rating Section */}
          {user && (
            <View style={styles.userRatingContainer}>
              <Text style={styles.ratingTitle}>
                {userRating > 0 ? "Your Rating:" : "Rate this business:"}
              </Text>
              <View style={styles.interactiveRating}>
                {renderStarRating(userRating, true)}
                {submittingRating && (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={styles.ratingLoader}
                  />
                )}
              </View>
              {hoveredRating > 0 && (
                <Text style={styles.ratingHint}>
                  Tap to give {hoveredRating} star{hoveredRating > 1 ? "s" : ""}
                </Text>
              )}
              {userRating > 0 && (
                <Text style={styles.userRatingText}>
                  You rated: {userRating} star{userRating > 1 ? "s" : ""}
                </Text>
              )}
            </View>
          )}

          {selectedBusiness.description && (
            <Text style={styles.description}>
              {selectedBusiness.description}
            </Text>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.detailText}>{selectedBusiness.address}</Text>
            </View>

            {selectedBusiness.phone && (
              <TouchableOpacity
                style={styles.detailItem}
                onPress={() => {
                  Alert.alert("Call", `Call ${selectedBusiness.phone}?`);
                }}
              >
                <Phone size={20} color={Colors.primary} />
                <Text style={[styles.detailText, styles.phoneText]}>
                  {selectedBusiness.phone}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.detailItem}>
              <Clock
                size={20}
                color={selectedBusiness.isOpen ? Colors.success : Colors.error}
              />
              <Text style={styles.detailText}>
                {selectedBusiness.openingHours
                  ? formatOpeningHours(
                      selectedBusiness.openingHours.open,
                      selectedBusiness.openingHours.close,
                      selectedBusiness.openingHours.days
                    )
                  : "Hours not available"}
              </Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Button
              title="Directions"
              onPress={handleGetDirections}
              icon={<Navigation size={18} color={Colors.white} />}
              style={styles.actionButton}
            />

            <Button
              title="View on Map"
              onPress={handleOpenMaps}
              variant="outline"
              icon={<MapPin size={18} color={Colors.primary} />}
              style={styles.actionButton}
            />
          </View>

          {/* Products Section (for restaurants) */}
          {selectedBusiness.products &&
            selectedBusiness.products.length > 0 && (
              <View style={styles.productsContainer}>
                <Text style={styles.sectionTitle}>Menu</Text>

                {selectedBusiness.products.map((product) => (
                  <View key={product.id} style={styles.productItem}>
                    {product.image && (
                      <Image
                        source={{ uri: product.image }}
                        style={styles.productImage}
                        contentFit="cover"
                        placeholder="https://via.placeholder.com/100x100?text=Food"
                      />
                    )}

                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      {product.description && (
                        <Text style={styles.productDescription}>
                          {product.description}
                        </Text>
                      )}
                      <Text style={styles.productPrice}>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </Text>
                      {!product.isAvailable && (
                        <Text style={styles.unavailableText}>
                          Currently unavailable
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

          {/* All Ratings Section */}
          {businessRatings.length > 0 && (
            <View style={styles.allRatingsContainer}>
              <Text style={styles.sectionTitle}>
                All Reviews ({businessRatings.length})
              </Text>

              <View style={styles.ratingsStats}>
                <Text style={styles.averageRatingText}>
                  Average: {selectedBusiness.rating?.toFixed(1) || "0.0"}/5
                </Text>

                {/* Rating Distribution */}
                <View style={styles.ratingDistribution}>
                  {[5, 4, 3, 2, 1].map((starLevel) => {
                    const count = businessRatings.filter(
                      (r) => Math.round(r) === starLevel
                    ).length;
                    const percentage =
                      businessRatings.length > 0
                        ? (count / businessRatings.length) * 100
                        : 0;

                    return (
                      <View key={starLevel} style={styles.distributionRow}>
                        <Text style={styles.starLevelText}>{starLevel}★</Text>
                        <View style={styles.distributionBar}>
                          <View
                            style={[
                              styles.distributionFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    marginBottom: 12,
    minWidth: 120,
  },
  backButton: {
    minWidth: 120,
  },
  shareButton: {
    padding: 8,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width,
    height: 250,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white + "80",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: Colors.white,
    width: 12,
  },
  categoryIconContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: Colors.white + "90",
    borderRadius: 25,
    padding: 8,
  },
  infoContainer: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starButton: {
    padding: 2,
    marginHorizontal: 1,
  },
  displayStar: {
    marginHorizontal: 1,
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  viewCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  totalRatings: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userRatingContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  interactiveRating: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingLoader: {
    marginLeft: 12,
  },
  ratingHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  userRatingText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: "center",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  phoneText: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  productsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  unavailableText: {
    fontSize: 12,
    color: Colors.error,
    fontStyle: "italic",
    marginTop: 4,
  },
  allRatingsContainer: {
    marginTop: 8,
  },
  ratingsStats: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  averageRatingText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  ratingDistribution: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starLevelText: {
    fontSize: 14,
    color: Colors.text,
    width: 30,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  countText: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 30,
    textAlign: "right",
  },
});
