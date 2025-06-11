"use client";

import * as React from "react";
import { useAtom } from 'jotai';
import { selectedCurrencyAtom, currencyInfo, Currency } from '@/store/currencyAtoms';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CurrencySwitcher() {
  const [currency, setCurrency] = useAtom(selectedCurrencyAtom);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{currencyInfo[currency].symbol} {currency}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
          {Object.entries(currencyInfo).map(([code, { name, symbol }]) => (
            <DropdownMenuRadioItem key={code} value={code}>
              {symbol} {name} ({code})
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
