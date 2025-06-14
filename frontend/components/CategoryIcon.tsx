import React from "react";
import { View, StyleSheet } from "react-native";
import { BusinessCategory } from "@/types";
import { Home, Hotel, Utensils, Pill, Fuel } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

interface CategoryIconProps {
  category: BusinessCategory;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 24,
  color = Colors.white,
  backgroundColor = Colors.primary,
}) => {
  const getIcon = () => {
    switch (category) {
      case "accommodation":
        return <Home size={size * 0.6} color={color} />;
      case "hotel":
        return <Hotel size={size * 0.6} color={color} />;
      case "restaurant":
        return <Utensils size={size * 0.6} color={color} />;
      case "pharmacy":
        return <Pill size={size * 0.6} color={color} />;
      case "gas_station":
        return <Fuel size={size * 0.6} color={color} />;
      default:
        return <Home size={size * 0.6} color={color} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      {getIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
