"use client";

import { Provider } from 'jotai';
import { ReactNode, Suspense } from 'react';

export default function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </Provider>
  );
}
