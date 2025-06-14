import { create } from "zustand";
import { Business, BusinessCategory } from "@/types";
import { BusinessService } from "@/services/BusinessService";

interface BusinessState {
  businesses: Business[];
  filteredBusinesses: Business[];
  selectedBusiness: Business | null;
  searchQuery: string;
  selectedCategory: BusinessCategory | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchBusinesses: () => Promise<void>;
  fetchBusinessById: (id: string) => Promise<void>;
  fetchBusinessesByCategory: (category: BusinessCategory) => Promise<void>;
  fetchBusinessesByOwner: (ownerId: string) => Promise<void>;
  fetchMostViewedBusinesses: (limit?: number) => Promise<void>;
  searchBusinesses: (query: string) => Promise<void>;
  addBusiness: (
    businessData: Omit<Business, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateBusiness: (
    id: string,
    businessData: Partial<Business>
  ) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;

  // Local actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: BusinessCategory | null) => void;
  filterBusinesses: () => void;
  clearError: () => void;
  clearSelectedBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businesses: [],
  filteredBusinesses: [],
  selectedBusiness: null,
  searchQuery: "",
  selectedCategory: null,
  loading: false,
  error: null,

  fetchBusinesses: async () => {
    set({ loading: true, error: null });
    try {
      const businesses = await BusinessService.getAllBusinesses();

      // Sort by view count (most viewed first)
      const sortedBusinesses = [...businesses].sort(
        (a, b) => b.viewCount - a.viewCount
      );

      set({
        businesses: sortedBusinesses,
        filteredBusinesses: sortedBusinesses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch businesses",
        loading: false,
      });
    }
  },

  fetchBusinessById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const business = await BusinessService.getBusinessById(id);
      set({ selectedBusiness: business, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch business details",
        loading: false,
      });
    }
  },

  fetchBusinessesByCategory: async (category: BusinessCategory) => {
    set({ loading: true, error: null, selectedCategory: category });
    try {
      const businesses = await BusinessService.getBusinessesByCategory(
        category
      );
      const sortedBusinesses = [...businesses].sort(
        (a, b) => b.viewCount - a.viewCount
      );

      set({
        filteredBusinesses: sortedBusinesses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch businesses by category",
        loading: false,
      });
    }
  },

  fetchBusinessesByOwner: async (ownerId: string) => {
    set({ loading: true, error: null });
    try {
      const businesses = await BusinessService.getBusinessesByOwner(ownerId);
      set({
        businesses,
        filteredBusinesses: businesses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch owner's businesses",
        loading: false,
      });
    }
  },

  fetchMostViewedBusinesses: async (limit = 5) => {
    set({ loading: true, error: null });
    try {
      const businesses = await BusinessService.getMostViewedBusinesses(limit);
      set({
        businesses,
        filteredBusinesses: businesses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch most viewed businesses",
        loading: false,
      });
    }
  },

  searchBusinesses: async (query: string) => {
    set({ loading: true, error: null, searchQuery: query });
    try {
      if (query.trim() === "") {
        // If empty query, show all businesses
        await get().fetchBusinesses();
      } else {
        const businesses = await BusinessService.searchBusinesses(query);
        set({
          filteredBusinesses: businesses,
          loading: false,
        });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to search businesses",
        loading: false,
      });
    }
  },

  addBusiness: async (businessData) => {
    set({ loading: true, error: null });
    try {
      const newBusiness = await BusinessService.createBusiness(businessData);

      // Add to local state
      const { businesses } = get();
      const updatedBusinesses = [newBusiness, ...businesses];

      set({
        businesses: updatedBusinesses,
        filteredBusinesses: updatedBusinesses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to add business",
        loading: false,
      });
      throw error; // Re-throw so component can handle it
    }
  },

  // updateBusiness: (id: string, businessData: Partial<Business>) => Promise<void>;

  // Và implementation:
  updateBusiness: async (id: string, businessData: Partial<Business>) => {
    set({ loading: true, error: null });
    try {
      const updatedBusiness = await BusinessService.updateBusiness(
        id,
        businessData
      );

      // Update local state
      const { businesses } = get();
      const updatedBusinesses = businesses.map((b) =>
        b.id === id ? updatedBusiness : b
      );

      set({
        businesses: updatedBusinesses,
        filteredBusinesses: updatedBusinesses,
        selectedBusiness: updatedBusiness,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update business",
        loading: false,
      });
      throw error;
    }
  },

  deleteBusiness: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await BusinessService.deleteBusiness(id);

      // Remove from local state
      const { businesses } = get();
      const updatedBusinesses = businesses.filter((b) => b.id !== id);

      set({
        businesses: updatedBusinesses,
        filteredBusinesses: updatedBusinesses,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete business",
        loading: false,
      });
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().filterBusinesses();
  },

  setSelectedCategory: (category: BusinessCategory | null) => {
    set({ selectedCategory: category });
    get().filterBusinesses();
  },

  filterBusinesses: () => {
    const { businesses, searchQuery, selectedCategory } = get();

    let filtered = businesses;

    if (selectedCategory) {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.address?.toLowerCase().includes(query)
      );
    }

    set({ filteredBusinesses: filtered });
  },

  clearError: () => set({ error: null }),
  clearSelectedBusiness: () => set({ selectedBusiness: null }),
}));
