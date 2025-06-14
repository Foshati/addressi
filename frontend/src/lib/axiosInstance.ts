import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000',
    withCredentials: true,

});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

// Handle logout and prevent infinite loop
export const handleLogout = () => {
    if (typeof window !== 'undefined' && window.location.pathname !== "/login") {
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Clear cookie
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
    config => {
        // Get token from cookies
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
)

// Handle expired tokens and refresh logic
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // If the error is 401 and the request was specifically for user info,
        // do not redirect to login. This allows pages to load without auth redirect.
        if (error.response?.status === 401 && (originalRequest.url?.endsWith('/api/v1/user/me') || originalRequest.url?.endsWith('/api/v1/linktree/profile')) && !originalRequest._retry) {
            return Promise.reject(error); // Just reject, let useQuery handle isError
        }

        // prevent infinite retry loop for other 401s
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(resolve => {
                    subscribeToRefreshToken(() => resolve(axiosInstance(originalRequest)));
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}/api/v1/auth/refresh-token`, {}, { withCredentials: true });
                isRefreshing = false;
                onRefreshSuccess();
                return axiosInstance(originalRequest);
            } catch (error) {
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout(); // This will only be called for other 401s now
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
)