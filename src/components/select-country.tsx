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

const SelectFlag: React.FC<SelectFlagProps> = ({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Select country...", 
  triggerClassName, 
  disabled 
}) => {
  const [open, setOpen] = React.useState(false)
  
  const selectedOption = React.useMemo(() => 
    options.find((option) => option.value === value), 
    [options, value]
  );
  
  const validOptions = React.useMemo(() => 
    options.filter(option => 
      option && 
      option.value && 
      option.label && 
      option.flag
    ),
    [options]
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
          {selectedOption ? (
            <div className="flex items-center">
              <span className="mr-2">{selectedOption.flag}</span>
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {validOptions.map((option, index) => (
                <CommandItem
                  key={`${option.value}-${index}`} // Unique key with fallback
                  value={`${option.value}__${option.label}`} // Unique value for search
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{option.flag}</span>
                  <span>{option.label}</span>
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