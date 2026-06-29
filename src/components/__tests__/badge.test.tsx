import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../ui/badge";

describe("Badge", () => {
  it("should render children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should apply variant classes", () => {
    const { rerender } = render(<Badge variant="success">OK</Badge>);
    expect(screen.getByText("OK").className).toContain("bg-success");

    rerender(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText("Error").className).toContain("bg-danger");
  });

  it("should show dot indicator", () => {
    render(<Badge dot>With dot</Badge>);
    const badge = screen.getByText("With dot");
    expect(badge.querySelector("span")).toBeInTheDocument();
  });

  it("should apply size classes", () => {
    render(<Badge size="lg">Large</Badge>);
    expect(screen.getByText("Large").className).toContain("px-3");
  });
});
