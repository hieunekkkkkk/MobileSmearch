import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Colors } from "@/constants/Colors";

interface TableColumn {
  key: string;
  title: string;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  onRowPress?: (row: any) => void;
}

export function Table({ columns, data, onRowPress }: TableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <View
              key={column.key}
              style={[styles.headerCell, { width: column.width || 120 }]}
            >
              <Text style={styles.headerText}>{column.title}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.map((row, index) => (
          <TouchableOpacity
            key={index}
            style={styles.row}
            onPress={() => onRowPress?.(row)}
          >
            {columns.map((column) => (
              <View
                key={column.key}
                style={[styles.cell, { width: column.width || 120 }]}
              >
                {column.render ? (
                  column.render(row[column.key], row)
                ) : (
                  <Text style={styles.cellText} numberOfLines={2}>
                    {row[column.key] || "-"}
                  </Text>
                )}
              </View>
            ))}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: Colors.primary || "#007bff",
  },
  headerCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)",
  },
  headerText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 12,
    color: "#333",
  },
});
