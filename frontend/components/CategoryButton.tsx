import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { BusinessCategory } from "@/types";
import { CategoryIcon } from "./CategoryIcon";
import { Colors } from "@/constants/Colors";

interface CategoryButtonProps {
  category: BusinessCategory;
  label: string;
  isSelected?: boolean;
  onPress: () => void;
}

export const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  label,
  isSelected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <CategoryIcon
        category={category}
        size={40}
        backgroundColor={isSelected ? Colors.primary : Colors.card}
        color={isSelected ? Colors.white : Colors.primary}
      />
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginRight: 12,
    width: 90,
  },
  selectedContainer: {
    backgroundColor: Colors.primary + "20", // 20% opacity
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
  },
  selectedLabel: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
