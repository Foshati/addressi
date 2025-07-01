"use client";

import { Status } from '@/store/atoms';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: Status;
}

const statusConfig = {
  ONLINE: { text: 'Online', className: 'bg-green-500' },
  OFFLINE: { text: 'Offline', className: 'bg-gray-500' },
  LOADING: { text: 'Loading...', className: 'bg-yellow-500 animate-pulse' },
  ERROR: { text: 'Error', className: 'bg-red-500' },
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.OFFLINE;

  return (
    <div className="flex items-center justify-center space-x-2 rounded-full border bg-card px-3 py-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', config.className)} />
      <span className="text-xs font-medium text-card-foreground">{config.text}</span>
    </div>
  );
}
