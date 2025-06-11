"use client"

import * as React from 'react';
import { useAtom } from 'jotai';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { selectedCurrencyAtom, currencyInfo, Currency } from '@/store/currencyAtoms';

export function CurrencySelector() {
  const [open, setOpen] = React.useState(false);
  const [selectedCurrency, setSelectedCurrency] = useAtom(selectedCurrencyAtom);

  const currencies = Object.keys(currencyInfo) as Currency[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {currencyInfo[selectedCurrency].symbol} {selectedCurrency}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency}
                  value={currency}
                  onSelect={(currentValue) => {
                    setSelectedCurrency(currentValue.toUpperCase() as Currency);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCurrency === currency ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {currencyInfo[currency].symbol} {currency}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
