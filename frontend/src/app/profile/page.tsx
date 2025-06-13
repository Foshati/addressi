"use client";

import React from 'react';
import { useUser } from '@/hooks/useUser';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)] overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {
                isLoading ? (
                  <>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                  </>
                ) : user ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-lg font-semibold">{user.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg font-semibold">{user.user.email}</p>
                    </div>
                  </>
                ) : (
                  <p>Could not load user details.</p>
                )
              }
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>A list of your past orders</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for order history */}
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Your order history will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
