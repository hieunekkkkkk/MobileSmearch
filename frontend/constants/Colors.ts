/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  primary: "#4A80F0",
  secondary: "#F5A623",
  background: "#FFFFFF",
  card: "#F8F9FA",
  text: "#1A1A1A",
  textSecondary: "#757575",
  border: "#E0E0E0",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  danger: "#D32F2F",
  inactive: "#9E9E9E",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.5)",
  gray: "#B0BEC5",
  lightGray: "#F5F5F5",
};
