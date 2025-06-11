"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface FlagOption {
  value: string;
  label: string;
  flag: string;
}

export interface SelectFlagProps {
  options: FlagOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

const SelectFlag: React.FC<SelectFlagProps> = ({ options, value, onValueChange, placeholder, triggerClassName, disabled }) => {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) =>
    option && typeof option.value === 'string' && typeof value === 'string' && option.value.toLowerCase() === value.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", triggerClassName)}
          disabled={disabled}
        >
          {selectedOption
            ? <><span className="mr-2">{selectedOption.flag}</span> {selectedOption.label}</>
            : placeholder || "Select country..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter(option => option && option.label)
                .map((option) => (
                <CommandItem
                  key={option.value} // Use unique value for key
                  value={option.label} // Search by label
                  onSelect={(selectedLabel) => {
                    const selectedOpt = options.find(opt => opt.label === selectedLabel);
                    if (selectedOpt) {
                      onValueChange(selectedOpt.value);
                    }
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{option.flag}</span>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SelectFlag;
