import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Define supported currencies and their properties
export type Currency = 'RUB' | 'IRR' | 'USD' | 'AED';

export const currencyInfo: Record<Currency, { symbol: string; name: string; }> = {
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  IRR: { symbol: 'T', name: 'Iranian Toman' },
  USD: { symbol: '$', name: 'US Dollar' },
  AED: { symbol: 'د.إ', name: 'Emirati Dirham' },
};

export interface ExchangeRates {
  rates: { [key: string]: number };
  base_code: string;
}

// 1. Atom for the selected currency, persisted in localStorage
export const selectedCurrencyAtom = atomWithStorage<Currency>('selectedCurrency', 'RUB');

// 2. Async atom to fetch exchange rates from a free API (base is RUB)
export const exchangeRatesAtom = atom<Promise<ExchangeRates>>(async () => {
  try {
    // Using a reliable free API for exchange rates
    const response = await fetch('https://open.er-api.com/v6/latest/RUB');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  } catch (error) {
    console.error("Failed to fetch exchange rates, using fallback:", error);
    // Provide fallback rates in case the API fails
    return {
      base_code: 'RUB',
      rates: { RUB: 1, IRR: 1500, USD: 0.011, AED: 0.04 },
    };
  }
});
