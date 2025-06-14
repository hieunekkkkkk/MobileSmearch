import { Platform, Linking } from "react-native";

export const openInMaps = (
  latitude: number,
  longitude: number,
  label: string
): void => {
  const scheme = Platform.select({ ios: "maps:", android: "geo:" });
  const url = Platform.select({
    ios: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`,
    android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    web: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`,
  });

  if (url) {
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred while opening maps:", err)
    );
  }
};

export const getDirections = (
  latitude: number,
  longitude: number,
  label: string
): void => {
  const url = Platform.select({
    ios: `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
    android: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}&travelmode=driving`,
    web: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}&travelmode=driving`,
  });

  if (url) {
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred while getting directions:", err)
    );
  }
};
