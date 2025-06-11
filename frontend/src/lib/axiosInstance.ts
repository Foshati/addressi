import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
    withCredentials: true,

});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

// Handle logout and prevent infinite loop
export const handleLogout = () => {
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";

    }
}

// Handle adding  a new access token to the request
export const subscribeToRefreshToken = (callback: () => void) => {
    refreshSubscribers.push(callback);
}

// Execute queued request after refresh
export const onRefreshSuccess = () => {
    refreshSubscribers.forEach((callback) => callback());
    refreshSubscribers = [];
}

// Handle API requests
axiosInstance.interceptors.request.use(
    config => config,
    error => Promise.reject(error)
)

// Handle expired tokens and refresh logic
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // prevent infinite retry loop
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(resolve => {
                    subscribeToRefreshToken(() => resolve(axiosInstance(originalRequest)));
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/auth/refresh-token`, {}, { withCredentials: true });
                isRefreshing = false;
                onRefreshSuccess();
                return axiosInstance(originalRequest);
            } catch (error) {
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
)