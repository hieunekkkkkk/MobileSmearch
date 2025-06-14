export const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

export const SUBSCRIPTION_PLANS = {
  OWNER: {
    id: "owner_basic",
    name: "Owner Basic",
    price: 100000,
    description: "Basic business listing with all features",
    features: [
      "Business profile",
      "Contact information",
      "Opening hours",
      "Business description",
      "Photo gallery",
    ],
  },
  VIP: {
    id: "owner_vip",
    name: "Owner VIP",
    price: 300000,
    description: "Premium business listing with additional visibility",
    features: [
      "All Owner Basic features",
      "Priority in search results",
      "Featured listing",
      "Promotional banner",
      "Analytics dashboard",
    ],
  },
  VIEWER: {
    id: "viewer_boost",
    name: "Viewer Boost",
    price: 50000,
    description: "Boost your business with 100 additional views",
    features: [
      "100 additional views",
      "Temporary boost in rankings",
      "Visibility report",
    ],
  },
};
