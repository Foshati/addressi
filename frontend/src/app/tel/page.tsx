"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { selectedCurrencyAtom, exchangeRatesAtom } from '@/store/currencyAtoms';
import * as api from '@/lib/api-tel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Copy, MessageSquare, Smartphone, X } from 'lucide-react';
import SelectFlag from '@/components/select-flag'; // Assuming this is a custom component
import SelectService from '@/components/select-service'; // Assuming this is a custom component

// Type Definitions
// (Assuming SortOption, getFlagEmoji, extractOtp, highlightOTP are defined elsewhere or are correct)

// Helper function from original code, assuming it's correct
function getFlagEmoji(iso: string) {
  if (typeof iso !== 'string' || iso.length < 2) return '🌐'; // Return a globe if iso is invalid
  return String.fromCodePoint(...iso.split('').map(char => 127397 + char.charCodeAt(0)));
}

function highlightOTP(text: string) {
  return text.replace(/(\d{4,})/g, '<strong class="text-primary text-lg">$1</strong>');
}

type SortOption = 'price_asc' | 'price_desc' | 'quantity_desc';

// Main Component
const FreeVirtualNumberPage = () => {
  const queryClient = useQueryClient();
  const [selectedCountry, setSelectedCountry] = useState<api.Country | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('price_asc');
  const [copied, setCopied] = useState<string | null>(null);

  const selectedCurrency = useAtomValue(selectedCurrencyAtom);
  const exchangeRatesData = useAtomValue(exchangeRatesAtom);
  const prevSmsCountRef = useRef<number | undefined>(undefined);

  // --- React Query Hooks ---

  const { data: allCountries = [], isLoading: isLoadingCountries, error: countriesError } = useQuery({
    queryKey: ['countries'],
    queryFn: api.getCountries,
  });

  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products', selectedCountry?.originalName],
    queryFn: () => api.getProductsByCountry(selectedCountry!.originalName),
    enabled: !!selectedCountry,
  });

  const { data: activeOrder, isLoading: isLoadingOrder, error: orderError } = useQuery({
    queryKey: ['order', activeOrderId],
    queryFn: () => {
      if (activeOrderId === null) {
        return Promise.reject(new Error('No active order ID'));
      }
      return api.checkOrder(activeOrderId);
    },
    enabled: !!activeOrderId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const buyNumberMutation = useMutation({
    mutationFn: (variables: { countryName: string; serviceId: string }) => api.buyNumber(variables),
    onSuccess: (data) => {
      setActiveOrderId(data.id);
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
    },
    onError: (error) => {
      console.error('Failed to buy number:', error);
      // Consider showing a user-facing error message here (e.g., using a toast library)
    },
  });

  // --- Effects ---

  useEffect(() => {
    if (activeOrderId && activeOrder?.status === 'PENDING') {
      const intervalId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['order', activeOrderId] });
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [activeOrderId, activeOrder, queryClient]);

  useEffect(() => {
    if (activeOrder) {
      const currentSmsCount = activeOrder.sms?.length ?? 0;
      if (prevSmsCountRef.current !== undefined && currentSmsCount > prevSmsCountRef.current) {
        new Notification('New SMS Received!', {
          body: activeOrder.sms[activeOrder.sms.length - 1].text,
        });
      }
      prevSmsCountRef.current = currentSmsCount;

      if (activeOrder.status !== 'PENDING') {
        // Order is complete, invalidate product quantities and stop polling
        queryClient.invalidateQueries({ queryKey: ['products', selectedCountry?.originalName] });
        setTimeout(() => {
          if (activeOrderId === activeOrder.id) {
            setActiveOrderId(null);
          }
        }, 5000); // Keep order visible for 5s after completion
      }
    }
  }, [activeOrder, activeOrderId, queryClient, selectedCountry]);

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // --- Memoized Values ---

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const sorted = [...products];
    switch (sortOption) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'quantity_desc':
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
    }
    return sorted;
  }, [products, sortOption]);

  const serviceOptions = useMemo(() => {
    if (!products) return [];
    return products.map(p => ({ value: p.id, label: p.name }));
  }, [products]);

  const exchangeRate = useMemo(() => {
    return exchangeRatesData?.rates[selectedCurrency] ?? 1;
  }, [selectedCurrency, exchangeRatesData]);

  // --- Event Handlers ---

  const handleCountrySelect = (iso: string) => {
    const country = allCountries.find(c => c.iso === iso) || null;
    setSelectedCountry(country);
    setSelectedService('');
    setActiveOrderId(null);
  };

  const handleServiceSelectAndBuy = (productId: string) => {
    if (!selectedCountry) return;
    setSelectedService(productId);
    buyNumberMutation.mutate({
      countryName: selectedCountry.originalName,
      serviceId: productId
    });
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // --- Render Logic ---

  const renderCountrySelector = () => (
    <SelectFlag
      options={allCountries.map(c => ({ value: c.iso, label: c.name, flag: getFlagEmoji(c.iso) }))}
      value={selectedCountry?.iso || ''}
      onValueChange={handleCountrySelect}
      placeholder="Country..."
      triggerClassName="w-full border-0 shadow-none focus-visible:ring-0 bg-transparent h-9"
    />
  );

  const renderServiceSelector = () => (
    <SelectService
      options={serviceOptions}
      value={selectedService}
      onValueChange={setSelectedService}
      placeholder="Any Service..."
      triggerClassName="flex-grow border-0 shadow-none focus-visible:ring-0 bg-transparent h-9"
      disabled={isLoadingProducts || !selectedCountry}
    />
  );

  const renderProductTable = () => {
    if (!selectedCountry) return <p className="text-center text-gray-500 mt-8">Please select a country to see available numbers.</p>;
    if (isLoadingProducts) return <p className="text-center mt-8">Loading numbers...</p>;
    if (productsError) return <p className="text-center text-red-500 mt-8">Could not load numbers. Please try again.</p>;
    if (!products || products.length === 0) return <p className="text-center text-gray-500 mt-8">No numbers available for {selectedCountry.name}.</p>;

    const filteredProducts = selectedService ? sortedProducts.filter(p => p.id === selectedService) : sortedProducts;

    return (
      <div className="mt-4">
        <div className="flex justify-end mb-2">
          <Select onValueChange={(value: SortOption) => setSortOption(value)} defaultValue={sortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="quantity_desc">Most Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell className="text-right">{(product.price * exchangeRate).toFixed(2)} {selectedCurrency}</TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handleServiceSelectAndBuy(product.id)}
                    disabled={buyNumberMutation.isPending || !!activeOrderId}
                  >
                    Get Number
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderActiveOrder = () => {
    if (!activeOrderId && !buyNumberMutation.isPending) return null;

    if (buyNumberMutation.isPending || (isLoadingOrder && !activeOrder)) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mt-4"></div>
        </div>
      );
    }

    if (orderError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-center text-red-700">Error</h3>
          <p className="text-center text-red-600 mt-2">{orderError.message}</p>
          <Button onClick={() => setActiveOrderId(null)} className="mt-4 w-full">Dismiss</Button>
        </div>
      );
    }

    if (!activeOrder) return null;

    const timeLeft = Math.round((new Date(activeOrder.expires).getTime() - Date.now()) / 1000);

    if (timeLeft <= 0 && activeOrder.status === 'PENDING') {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-center text-yellow-700">Order Timed Out</h3>
          <p className="text-center text-yellow-600 mt-2">The time to receive an SMS has expired.</p>
          <Button onClick={() => setActiveOrderId(null)} className="mt-4 w-full">Close</Button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4 bg-background p-3 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono">{activeOrder.phone}</span>
              <Badge variant={activeOrder.status === 'PENDING' ? 'default' : activeOrder.status === 'RECEIVED' ? 'secondary' : 'destructive'}>{activeOrder.status}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(activeOrder.phone)}>
              {copied === activeOrder.phone ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {activeOrder.status === 'PENDING' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              <Button variant="ghost" size="icon" onClick={() => setActiveOrderId(null)} title="Cancel Order">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">SMS History:</h3>
          {activeOrder.sms && activeOrder.sms.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-4">
                {activeOrder.sms.map((sms: { from: string; text: string }, index: number) => (
                  <div key={index} className="p-3 rounded-md border bg-muted/50">
                    <p className="text-sm text-muted-foreground">From: {sms.from}</p>
                    <p className="text-md" dangerouslySetInnerHTML={{ __html: highlightOTP(sms.text) }} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground pt-10">
              <MessageSquare className="mx-auto h-12 w-12 mb-2" />
              <p>Waiting for SMS...</p>
              {activeOrder.status === 'PENDING' && <p className="text-xs">(Expires in {timeLeft} seconds)</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {countriesError && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
          <span className="font-medium">Error loading countries:</span> {countriesError.message}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Smartphone className="mr-2" />1. Select Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow">
                {isLoadingCountries
                  ? <Skeleton className="h-9 w-full m-1" />
                  : renderCountrySelector()
                }
                <div className="h-5 border-l border-input"></div>
                {renderServiceSelector()}
                <div className="h-5 border-l border-input"></div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-9">Sort & Filter</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    {/* Add filtering options here */}
                    <p>Sorting and filtering options will be here.</p>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Smartphone className="mr-2" />2. Choose a Number</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] border rounded-md">
                {renderProductTable()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center"><Smartphone className="mr-2" />3. Your Number & SMS</CardTitle>
          </CardHeader>
          <CardContent>
            {renderActiveOrder()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreeVirtualNumberPage;