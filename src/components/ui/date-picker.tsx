"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled,
  className,
  id,
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState(
    value ? format(value, "dd/MM/yyyy") : ""
  )

  // Update input when value changes externally
  React.useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "dd/MM/yyyy"))
    } else if (!value) {
      setInputValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    // Simple DD/MM/YYYY parsing
    // We try to parse when we have at least 10 characters
    if (val.length === 10) {
      const parsedDate = parse(val, "dd/MM/yyyy", new Date())
      if (isValid(parsedDate)) {
        onChange?.(parsedDate)
      }
    } else if (val.length === 0) {
      onChange?.(undefined)
    }
  }

  const handleBlur = () => {
    // If invalid date on blur, revert to the current value's format
    if (inputValue.length > 0) {
      const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date())
      if (!isValid(parsedDate)) {
        if (value) {
          setInputValue(format(value, "dd/MM/yyyy"))
        } else {
          setInputValue("")
        }
      }
    }
  }

  return (
    <div className={cn("relative flex items-center group", className)}>
      <Input
        id={id}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="pr-10 focus-visible:ring-1"
        maxLength={10}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 h-full w-10 px-0 hover:bg-transparent text-muted-foreground group-hover:text-foreground transition-colors"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              if (date) {
                setInputValue(format(date, "dd/MM/yyyy"))
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
