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

interface SelectServiceProps {
  options: ServiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

const SelectService: React.FC<SelectServiceProps> = ({ options, value, onValueChange, placeholder, triggerClassName, disabled }) => {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find(option => option.value === value)

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
          {selectedOption ? selectedOption.label : placeholder || "Select service..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="start">
        <Command>
          <CommandInput placeholder="Search service..." />
          <CommandList>
            <CommandEmpty>No service found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Search by label
                  onSelect={(selectedLabel) => {
                    const selectedOpt = options.find(opt => opt.label === selectedLabel);
                    if (selectedOpt) {
                      onValueChange(selectedOpt.value === value ? "" : selectedOpt.value)
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

export default SelectService
