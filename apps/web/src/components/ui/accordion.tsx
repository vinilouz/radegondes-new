"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionItem {
  id: string
  title: string | React.ReactNode
  children: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
  defaultValue?: string[]
  maxHeight?: string
}

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ items, className, defaultValue = [], maxHeight, ...props }, ref) => {
  const [value, setValue] = React.useState<string[]>(defaultValue)

  return (
    <div className={cn("space-y-2", className)} style={{ maxHeight, overflowY: 'auto' }}>
      <AccordionPrimitive.Root
        type="multiple"
        value={value}
        onValueChange={setValue}
        {...props}
      >
        {items.map((item) => (
          <AccordionPrimitive.Item key={item.id} value={item.id} className="border rounded-lg overflow-hidden">
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className={cn(
                  "flex flex-1 items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors",
                  "focus:outline-none"
                )}
              >
                <div className="flex-1 pr-3">
                  {typeof item.title === 'string' ? (
                    <span className="font-medium">{item.title}</span>
                  ) : (
                    item.title
                  )}
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 shrink-0" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="px-4 pb-4 border-t data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              {item.children}
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  )
})

Accordion.displayName = "Accordion"

export { Accordion }