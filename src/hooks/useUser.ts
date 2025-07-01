import { axiosInstance } from "@/lib/axiosInstance";
import { useQuery } from "@tanstack/react-query";

// Improved fetch user function with error handling
export const fetchUser = async () => {
    const response = await axiosInstance.get("/api/v1/user/me");
    return response.data;
}

export const useUser = () => {
    const { data: user, isLoading, isError, refetch } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1
    });

    return { user, isLoading, isError, refetch };
}