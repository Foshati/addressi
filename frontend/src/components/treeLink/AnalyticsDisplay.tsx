'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api-treeLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsDisplay() {
    const { data: analytics, isLoading, isError } = useQuery({
        queryKey: ['analytics'],
        queryFn: getAnalytics
    });

    if (isLoading) return <div>Loading analytics...</div>;
    if (isError) return <div>Error loading analytics.</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Total Clicks: {analytics?.totalClicks ?? 0}</p>
                {/* You can add more detailed analytics here */}
            </CardContent>
        </Card>
    );
}
