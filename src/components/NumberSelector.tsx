import { useState } from "react";

interface NumberSelectorProps {
  selected: number | null;
  onSelect: (n: number) => void;
}

const NumberSelector = ({ selected, onSelect }: NumberSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((num, idx) => {
        const isSelected = selected === num;
        return (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className={`
              relative w-full aspect-square rounded-xl font-display text-2xl font-bold
              transition-all duration-300 transform
              ${
                isSelected
                  ? "gradient-gold text-primary-foreground scale-110 glow-gold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-105"
              }
            `}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {num}
            {isSelected && (
              <div className="absolute inset-0 rounded-xl animate-pulse-gold" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default NumberSelector;
