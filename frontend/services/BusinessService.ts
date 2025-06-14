import { Business, BusinessCategory } from "@/types";

const BE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export class BusinessService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BE_URL}/api/businesses${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getAllBusinesses(): Promise<Business[]> {
    return this.makeRequest<Business[]>("");
  }

  static async getBusinessById(id: string): Promise<Business> {
    return this.makeRequest<Business>(`/${id}`);
  }

  static async getBusinessesByCategory(
    category: BusinessCategory
  ): Promise<Business[]> {
    return this.makeRequest<Business[]>(`/category/${category}`);
  }

  static async getBusinessesByOwner(ownerId: string): Promise<Business[]> {
    return this.makeRequest<Business[]>(`/owner/${ownerId}`);
  }

  static async getMostViewedBusinesses(limit: number = 5): Promise<Business[]> {
    return this.makeRequest<Business[]>(`/most-viewed?limit=${limit}`);
  }

  static async createBusiness(
    businessData: Omit<Business, "id" | "createdAt" | "updatedAt">
  ): Promise<Business> {
    return this.makeRequest<Business>("", {
      method: "POST",
      body: JSON.stringify(businessData),
    });
  }

  static async updateBusiness(
    id: string,
    businessData: Partial<Business>
  ): Promise<Business> {
    return this.makeRequest<Business>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(businessData),
    });
  }

  static async deleteBusiness(id: string): Promise<void> {
    await this.makeRequest<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  static async searchBusinesses(query: string): Promise<Business[]> {
    return this.makeRequest<Business[]>(
      `/search?q=${encodeURIComponent(query)}`
    );
  }
}
