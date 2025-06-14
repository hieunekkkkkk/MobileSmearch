export type UserRole = "client" | "owner" | "admin";

export type BusinessCategory =
  | "accommodation"
  | "hotel"
  | "restaurant"
  | "pharmacy"
  | "gas_station";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  category: BusinessCategory;
  description?: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  openingHours: {
    open: string; // Format: "HH:MM"
    close: string; // Format: "HH:MM"
    days: number[]; // 0-6, where 0 is Sunday
  };
  isOpen: boolean;
  images: string[];
  viewCount: number;
  rating: number;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  paymentId?: string;
}

export interface PaymentInfo {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  method: "momo";
  createdAt: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  businesses: Business[];
  filteredBusinesses: Business[];
  selectedBusiness: Business | null;
  searchQuery: string;
  selectedCategory: BusinessCategory | null;
  loading: boolean;
  error: string | null;
}
