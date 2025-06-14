"use client";

import React from 'react';
import { ModeToggle } from '../ModeToggle';
import { CurrencySwitcher } from '../currency-switcher';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { Button } from '../ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import { useRouter } from 'next/navigation';
import { Fingerprint, Menu } from 'lucide-react';

const Header = () => {
    const { user, isLoading } = useUser();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const logoutMutation = useMutation({
        mutationFn: async () => {
            // We will create this endpoint in the backend next
            return await axiosInstance.post('/api/v1/auth/logout');
        },
        onSuccess: () => {
            // Invalidate user query to refetch and update UI
            queryClient.invalidateQueries({ queryKey: ['user'] });
            router.push('/');
        },
        onError: (error) => {
            console.error("Logout failed:", error);
        }
    });

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    return (
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="container mx-auto h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-lg flex items-center gap-2 mx-4">
                    123
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/email" className="text-muted-foreground hover:text-foreground transition-colors">Email</Link>
                    <Link href="/tel" className="text-muted-foreground hover:text-foreground transition-colors">Virtual number</Link>
                    <Link href="/zipLink" className="text-muted-foreground hover:text-foreground transition-colors">zip Link</Link>
                </nav>

                <div className="flex items-center gap-2">

                    {!isMounted ? (
                        <Skeleton className="h-8 w-28" />
                    ) : (
                        <>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : user?.user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">{user.user.name}</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>{user.user.email}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/profile')}>
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                                            <span>Theme</span>
                                            <ModeToggle />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                                            <span>Currency</span>
                                            <CurrencySwitcher />
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label="Open menu">
                                            <Fingerprint className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link href="/login" className="w-full">Login</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                                            <span>Theme</span>
                                            <ModeToggle />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                                            <span>Currency</span>
                                            <CurrencySwitcher />
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </>
                    )}


                    {/* Mobile nav */}
                    <div className="md:hidden mr-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/email">Email</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/tel">Virtual number</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/zipLink">zip Link</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
