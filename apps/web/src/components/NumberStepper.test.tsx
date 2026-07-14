import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberStepper } from "./NumberStepper";

describe("NumberStepper", () => {
  it("increments and decrements by the given step", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberStepper id="hr" label="Heart rate" value={100} onChange={onChange} step={5} />);

    await user.click(screen.getByRole("button", { name: /increase heart rate/i }));
    expect(onChange).toHaveBeenCalledWith(105);

    await user.click(screen.getByRole("button", { name: /decrease heart rate/i }));
    expect(onChange).toHaveBeenCalledWith(95);
  });

  it("does not decrement below the configured minimum", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberStepper id="hr" label="Heart rate" value={2} onChange={onChange} step={5} min={0} />);

    await user.click(screen.getByRole("button", { name: /decrease heart rate/i }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("treats an undefined value as zero when incrementing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberStepper id="temp" label="Temperature" value={undefined} onChange={onChange} step={0.1} />);

    await user.click(screen.getByRole("button", { name: /increase temperature/i }));
    expect(onChange).toHaveBeenCalledWith(0.1);
  });
});
