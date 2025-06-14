import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

interface BusinessStatusBadgeProps {
  isOpen: boolean;
}

export const BusinessStatusBadge: React.FC<BusinessStatusBadgeProps> = ({
  isOpen,
}) => {
  return (
    <View
      style={[
        styles.container,
        isOpen ? styles.openContainer : styles.closedContainer,
      ]}
    >
      <View style={[styles.dot, isOpen ? styles.openDot : styles.closedDot]} />
      <Text style={[styles.text, isOpen ? styles.openText : styles.closedText]}>
        {isOpen ? "Open" : "Closed"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openContainer: {
    backgroundColor: Colors.success + "20", // 20% opacity
  },
  closedContainer: {
    backgroundColor: Colors.error + "20", // 20% opacity
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  openDot: {
    backgroundColor: Colors.success,
  },
  closedDot: {
    backgroundColor: Colors.error,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
  openText: {
    color: Colors.success,
  },
  closedText: {
    color: Colors.error,
  },
});
