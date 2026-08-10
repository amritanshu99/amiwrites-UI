import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Header from "./Header";

const mockSpaNavigate = jest.fn();

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
  useVerifiedAuth: () => ({
    isAuthenticated: true,
    username: "amritanshu99",
    isAdmin: true,
  }),
}));

jest.mock("../../utils/adminRoutePreload", () => ({
  preloadAdminRoutes: jest.fn(() => Promise.resolve([])),
}));

jest.mock("../Auth/SignupModal", () => () => null);
jest.mock("../Auth/LoginModal", () => () => null);

beforeEach(() => mockSpaNavigate.mockClear());

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
