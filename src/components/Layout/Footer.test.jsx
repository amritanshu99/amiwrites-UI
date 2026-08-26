import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Footer from "./Footer";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true },
);

let appShell;

beforeEach(() => {
  appShell = document.createElement("div");
  appShell.className = "amiverse-app-shell";
  appShell.scrollTo = jest.fn();
  document.body.appendChild(appShell);
});

afterEach(() => {
  appShell.remove();
});

test("uses the shared site chrome and comfortable responsive link targets", () => {
  render(<Footer />);

  expect(screen.getByRole("contentinfo")).toHaveClass(
    "amiverse-site-chrome",
  );
  expect(screen.getByTestId("footer-content")).toHaveClass(
    "max-w-[90rem]",
    "pb-[calc(1rem+env(safe-area-inset-bottom))]",
    "pt-3",
  );
  expect(screen.getByRole("navigation", { name: "Company links" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Product links" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Legal links" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "AI Chat" })).toHaveClass("min-h-11");
  expect(screen.getByRole("button", { name: "Back to top" })).toHaveClass(
    "min-h-11",
  );
});

test("opens contact and scrolls the app shell back to the top", () => {
  const openContact = jest.fn();
  window.addEventListener("open-contact-modal", openContact);
  render(<Footer />);

  fireEvent.click(screen.getByRole("button", { name: "Contact" }));
  expect(openContact).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
  expect(appShell.scrollTo).toHaveBeenCalledWith({
    top: 0,
    behavior: "smooth",
  });

  window.removeEventListener("open-contact-modal", openContact);
});
