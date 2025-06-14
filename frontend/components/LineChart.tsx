import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors } from "@/constants/Colors";

interface ChartData {
  month: string;
  revenue: number;
}

interface LineChartProps {
  data: ChartData[];
  title?: string;
}

const { width } = Dimensions.get("window");
const chartWidth = width - 40;
const chartHeight = 200;

export function LineChart({ data, title }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const minRevenue = Math.min(...data.map((d) => d.revenue));
  const range = maxRevenue - minRevenue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * (chartWidth - 60);
    const y =
      chartHeight -
      60 -
      ((item.revenue - minRevenue) / range) * (chartHeight - 80);
    return { x: x + 30, y, revenue: item.revenue, month: item.month };
  });

  // Create path string for the line
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;
    return `${path} L${point.x},${point.y}`;
  }, "");

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisContainer}>
          {[
            maxRevenue,
            maxRevenue * 0.75,
            maxRevenue * 0.5,
            maxRevenue * 0.25,
            0,
          ].map((value, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {(value / 1000000).toFixed(0)}M
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { top: (chartHeight - 60) * ratio + 20 },
              ]}
            />
          ))}

          {/* Data points and line simulation */}
          {points.map((point, index) => (
            <View key={index}>
              {/* Line segment */}
              {index > 0 && (
                <View
                  style={[
                    styles.lineSegment,
                    {
                      left: points[index - 1].x,
                      top: Math.min(points[index - 1].y, point.y),
                      width: Math.sqrt(
                        Math.pow(point.x - points[index - 1].x, 2) +
                          Math.pow(point.y - points[index - 1].y, 2)
                      ),
                      height: 2,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            point.y - points[index - 1].y,
                            point.x - points[index - 1].x
                          )}rad`,
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Data point */}
              <View
                style={[
                  styles.dataPoint,
                  { left: point.x - 4, top: point.y - 4 },
                ]}
              />
            </View>
          ))}
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisContainer}>
          {data.map((item, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {item.month}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
    textAlign: "center",
  },
  chartContainer: {
    position: "relative",
  },
  yAxisContainer: {
    position: "absolute",
    left: 0,
    top: 20,
    height: chartHeight - 60,
    justifyContent: "space-between",
    width: 25,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "right",
  },
  chartArea: {
    marginLeft: 30,
    height: chartHeight - 40,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  lineSegment: {
    position: "absolute",
    backgroundColor: Colors.primary || "#007bff",
  },
  dataPoint: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary || "#007bff",
    borderWidth: 2,
    borderColor: "white",
  },
  xAxisContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 30,
    marginTop: 10,
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#6c757d",
  },
  noDataContainer: {
    height: chartHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#6c757d",
    fontStyle: "italic",
  },
});
