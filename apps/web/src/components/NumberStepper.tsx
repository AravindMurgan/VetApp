interface NumberStepperProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  min?: number;
}

export function NumberStepper({ id, label, value, onChange, step = 1, min = 0 }: NumberStepperProps) {
  function round(n: number): number {
    return Math.round(n * 100) / 100;
  }

  function decrement() {
    onChange(round(Math.max(min, (value ?? 0) - step)));
  }

  function increment() {
    onChange(round((value ?? 0) + step));
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          aria-label={`Decrease ${label}`}
          className="h-9 w-9 rounded-md border border-black/20 text-lg leading-none"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
          className="w-20 rounded-md border border-black/20 px-2 py-2 text-center"
        />
        <button
          type="button"
          onClick={increment}
          aria-label={`Increase ${label}`}
          className="h-9 w-9 rounded-md border border-black/20 text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
