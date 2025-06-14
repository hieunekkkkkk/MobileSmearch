import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Business } from "@/types";
import { CategoryIcon } from "./CategoryIcon";
import { Colors } from "@/constants/Colors";
import { MapPin, Star, Eye } from "lucide-react-native";
import { BusinessStatusBadge } from "./BusinessStatusBadge";

interface BusinessCardProps {
  business: Business;
  onPress: (business: Business) => void;
}

const { width } = Dimensions.get("window");
const cardWidth = width * 0.9;

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(business)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: business.images[0] }}
        style={styles.image}
        contentFit="fill"
        transition={200}
      />

      <View style={styles.categoryIconContainer}>
        <CategoryIcon category={business.category} size={36} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {business.name}
          </Text>
          <BusinessStatusBadge isOpen={business.isOpen} />
        </View>

        <View style={styles.locationContainer}>
          <MapPin size={14} color={Colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {business.address}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.statsContainer}>
            <Star size={14} color={Colors.secondary} />
            <Text style={styles.rating}>{business.rating.toFixed(1)}</Text>
          </View>

          <View style={styles.statsContainer}>
            <Eye size={14} color={Colors.textSecondary} />
            <Text style={styles.views}>{business.viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 160,
  },
  categoryIconContainer: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 4,
  },
  views: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});
