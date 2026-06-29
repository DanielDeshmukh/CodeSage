import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../ui/progress-bar";

describe("ProgressBar", () => {
  it("should render with percentage", () => {
    render(<ProgressBar value={50} />);
    const bar = screen.getByRole("progressbar", { hidden: true }) || document.querySelector('[style*="width"]');
    expect(bar).toBeTruthy();
  });

  it("should show label when showLabel is true", () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should clamp value to 0-100", () => {
    const { rerender } = render(<ProgressBar value={150} showLabel />);
    expect(screen.getByText("100%")).toBeInTheDocument();

    rerender(<ProgressBar value={-10} showLabel />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should apply size classes", () => {
    const { container } = render(<ProgressBar value={50} size="lg" />);
    expect(container.querySelector(".h-3")).toBeInTheDocument();
  });

  it("should apply color classes", () => {
    const { container } = render(<ProgressBar value={50} color="success" />);
    expect(container.querySelector(".bg-success")).toBeInTheDocument();
  });
});
