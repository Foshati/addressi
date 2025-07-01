/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1/tel",
  timeout: 15000, // 15 second timeout
});

// Global error handler for all API requests
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "An unknown API error occurred";
    return Promise.reject(new Error(errorMessage));
  }
);

// --- Type Definitions ---
export interface Country {
  iso: string;
  name: string;
  originalName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  phone: string;
  product: string;
  price: number;
  status: "PENDING" | "RECEIVED" | "CANCELED" | "TIMEOUT" | "BANNED";
  expires: string;
  sms: { code: string; text: string; from: string }[];
  created_at: string;
}

interface ProductDetails {
  Price: number;
  Qty: number;
}

export interface ServiceOption {
  value: string;
  label: string;
}

// --- API Functions ---

export const getCountries = async (): Promise<Country[]> => {
  const countryData = await apiClient.get("/guest/countries");
  return Object.entries(countryData)
    .map(([originalName, details]: [string, any]) => ({
      name: details.text_en,
      iso: details.iso,
      originalName: originalName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getAllServices = async (): Promise<ServiceOption[]> => {
  const serviceData = await apiClient.get("/guest/products/russia/any");
  return Object.keys(serviceData)
    .map((id) => ({
      value: id,
      label: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " "),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const getProductsByCountry = async (
  countryName: string
): Promise<Product[]> => {
  if (!countryName) return [];
  const data = await apiClient.get(`/guest/products/${countryName}/any`);
  return Object.entries(data)
    .map(([id, details]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " "),
      price: (details as ProductDetails).Price,
      quantity: (details as ProductDetails).Qty,
    }))
    .filter((p) => p.quantity > 0);
};

export const buyNumber = async ({
  countryName,
  serviceId,
}: {
  countryName: string;
  serviceId: string;
}): Promise<Order> => {
  return apiClient.post(`/user/buy/activation/${countryName}/any/${serviceId}`);
};

export const checkOrder = async (orderId: number): Promise<Order> => {
  return apiClient.get(`/user/check/${orderId}`);
};
