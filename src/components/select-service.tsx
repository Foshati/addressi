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

export interface ServiceOption {
  value: string;
  label: string;
}

export interface SelectServiceProps {
  options: ServiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

const SelectService: React.FC<SelectServiceProps> = ({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Select service...", 
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
      option.label
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
          className={cn("w-full justify-between", triggerClassName)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search service..." />
          <CommandList>
            <CommandEmpty>No service found.</CommandEmpty>
            <CommandGroup>
              {validOptions.map((option, index) => (
                <CommandItem
                  key={`${option.value}-${index}`}
                  value={`${option.value}__${option.label}`}
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

export default SelectService;