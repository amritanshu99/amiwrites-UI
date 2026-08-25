import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Header from "./Header";

const mockSpaNavigate = jest.fn();
let mockAuthState;

jest.mock(
  "react-router-dom",
  () => {
    const React = jest.requireActual("react");

    const Link = ({ children, onClick, to, ...props }) => (
      <a
        href={to}
        onClick={(event) => {
          event.preventDefault();
          onClick?.(event);
          mockSpaNavigate(to);
        }}
        {...props}
      >
        {children}
      </a>
    );

    const NavLink = ({ children, className, to, ...props }) => {
      const isActive = to === "/";
      return (
        <Link
          to={to}
          className={
            typeof className === "function" ? className({ isActive }) : className
          }
          {...props}
        >
          {typeof children === "function" ? children({ isActive }) : children}
        </Link>
      );
    };

    return {
      Link,
      NavLink,
      useLocation: () => ({ pathname: "/" }),
    };
  },
  { virtual: true },
);

jest.mock("../../hooks/useVerifiedAuth", () => ({
  useVerifiedAuth: () => mockAuthState,
}));

jest.mock("../../utils/adminRoutePreload", () => ({
  preloadAdminRoutes: jest.fn(() => Promise.resolve([])),
}));

jest.mock("../Auth/SignupModal", () => () => null);
jest.mock("../Auth/LoginModal", () => () => null);

beforeEach(() => {
  mockSpaNavigate.mockClear();
  localStorage.clear();
  document.documentElement.className = "";
  delete document.documentElement.dataset.themeTransition;
  mockAuthState = {
    isAuthenticated: true,
    username: "amritanshu99",
    displayName: null,
    avatarUrl: null,
    isAdmin: true,
  };
});

test("switches theme synchronously and announces the new mode", () => {
  const themeChanges = [];
  const handleThemeChange = (event) => themeChanges.push(event.detail);
  window.addEventListener("amiverse-theme-change", handleThemeChange);

  const { unmount } = render(<Header setLoading={jest.fn()} />);
  const darkModeButton = screen.getByRole("button", {
    name: "Switch to dark mode",
  });

  fireEvent.click(darkModeButton);

  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  expect(
    screen.getByRole("button", { name: "Switch to light mode" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(themeChanges).toContainEqual({ isDark: true });

  unmount();
  window.removeEventListener("amiverse-theme-change", handleThemeChange);
});

test("keeps the compact navigation available through tablet widths", () => {
  mockAuthState = {
    isAuthenticated: false,
    username: null,
    displayName: null,
    avatarUrl: null,
    isAdmin: false,
  };

  render(<Header setLoading={jest.fn()} />);

  expect(screen.getByRole("button", { name: "Toggle menu" })).toHaveClass(
    "lg:hidden",
  );
  expect(screen.getByTestId("desktop-navigation-shell")).toHaveClass(
    "hidden",
    "lg:flex",
  );
  expect(screen.getByTestId("desktop-auth-actions")).toHaveClass("hidden", "lg:flex");
});

test.each([
  ["Create Blog", "/add-blog"],
  ["Ami Pulse Settings", "/ami-pulse-settings"],
  ["AmiBot Admin", "/amibot-admin"],
])("navigates to %s without leaving the SPA", (label, destination) => {
  render(<Header setLoading={jest.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: "User menu" }));
  fireEvent.click(screen.getByRole("menuitem", { name: label }));

  expect(mockSpaNavigate).toHaveBeenCalledWith(destination);
});

test("renders a responsive Google profile avatar and display name without changing the user menu", () => {
  mockAuthState = {
    isAuthenticated: true,
    username: "alice",
    displayName: "Alice Reader",
    avatarUrl: "https://lh3.googleusercontent.com/a/alice=s96-c",
    isAdmin: false,
  };

  render(<Header setLoading={jest.fn()} />);

  const image = screen.getByRole("img", {
    name: "Alice Reader's profile picture",
  });
  expect(image).toHaveAttribute(
    "src",
    "https://lh3.googleusercontent.com/a/alice=s256-c",
  );
  expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "User menu" }));
  expect(screen.getByText("Alice Reader")).toBeInTheDocument();

  fireEvent.error(image);
  expect(
    screen.queryByRole("img", { name: "Alice Reader's profile picture" }),
  ).not.toBeInTheDocument();
  expect(screen.getByTestId("user-avatar-fallback")).toHaveTextContent("A");
});
