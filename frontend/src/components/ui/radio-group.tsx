import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, className, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          className={cn("flex flex-col gap-3", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const isSelected = context.value === value;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col p-4 border rounded-lg cursor-pointer transition-colors",
          isSelected
            ? "border-primary bg-accent"
            : "border-border hover:border-primary",
          className
        )}
        onClick={() => context.onValueChange?.(value)}
        role="radio"
        aria-checked={isSelected}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              isSelected ? "border-primary" : "border-input"
            )}
          >
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
