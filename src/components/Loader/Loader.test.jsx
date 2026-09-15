import { render, screen } from "@testing-library/react";
import Loader from "./Loader";
import AppLoadingFallback from "./AppLoadingFallback";
test("keeps the spinner accessible when the loading label and exit state change", () => {
  const { container, rerender } = render(<Loader />);
  expect(screen.getByRole("status", { name: "Loading AmiVerse" })).toHaveAttribute("aria-busy", "true");
  expect(container.querySelector(".amiverse-loading-spinner")).toHaveAttribute("aria-hidden", "true");
  expect(container.textContent).toBe("");

  rerender(<Loader label="Verifying access" isExiting />);
  expect(screen.getByRole("status", { name: "Verifying access" })).toHaveAttribute("data-state", "exiting");
  expect(container.querySelector(".amiverse-loading-spinner")).toBeInTheDocument();
});

test("keeps button spinners inline and preserves their accessible labels", () => {
  const { container } = render(<Loader size="small" label="Signing in" />);
  expect(screen.getByRole("status", { name: "Signing in" }).tagName).toBe("SPAN");
  expect(container.querySelector(".amiverse-loading-card")).toBeNull();
  expect(container.querySelector(".amiverse-loading-backdrop")).toBeNull();
});

test("uses the refreshed full-screen layout with the correct route label", () => {
  const { rerender } = render(<AppLoadingFallback pathname="/add-blog" />);
  expect(screen.getByRole("status", { name: "Loading Create Blog" })).toHaveAttribute("data-opaque", "true");
  rerender(<AppLoadingFallback pathname="/blogs" />);
  expect(screen.getByRole("status", { name: "Loading AmiVerse" })).toBeInTheDocument();
});
