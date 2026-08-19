import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import LoginModal from "./LoginModal";
import { loginWithPassword } from "../../utils/authApi";
import { updatePulseLocationFromBrowser } from "../../utils/pulseLocation";

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

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("../../utils/authApi", () => ({
  continueWithGoogle: jest.fn(),
  loginWithPassword: jest.fn(),
  requestPasswordReset: jest.fn(),
  signupWithPassword: jest.fn(),
}));
jest.mock("../../utils/pulseLocation", () => ({
  getGeolocationErrorMessage: jest.fn(() => "Location update failed."),
  updatePulseLocationFromBrowser: jest.fn(),
}));
jest.mock("./GoogleSignInButton", () => () => (
  <button type="button">Continue with Google</button>
));
jest.mock("./Modal", () => ({ isOpen, children, title, description }) =>
  isOpen ? (
    <div role="dialog" aria-label={title}>
      <p>{description}</p>
      {children}
    </div>
  ) : null,
);

const encodeJwtPart = (value) =>
  btoa(JSON.stringify(value))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createSession = (username) => {
  const payload = {
    username,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return {
    token: `${encodeJwtPart({ alg: "HS256", typ: "JWT" })}.${encodeJwtPart(
      payload,
    )}.signature`,
    payload,
    user: null,
  };
};

const renderLogin = (onClose = jest.fn()) => {
  render(<LoginModal isOpen onClose={onClose} />);
  return onClose;
};

const submitLogin = (identifier) => {
  fireEvent.change(screen.getByLabelText("Email or username"), {
    target: { value: identifier },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  updatePulseLocationFromBrowser.mockResolvedValue({
    locationLabel: "Greater Noida, India",
  });
});

test("signs in with an email-or-username identifier and commits the app session", async () => {
  const session = createSession("reader");
  const onClose = renderLogin();
  loginWithPassword.mockResolvedValue(session);

  submitLogin(" Reader@example.com ");

  await waitFor(() =>
    expect(loginWithPassword).toHaveBeenCalledWith({
      identifier: "Reader@example.com",
      password: "password",
    }),
  );
  expect(localStorage.getItem("token")).toBe(session.token);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(updatePulseLocationFromBrowser).not.toHaveBeenCalled();
});

test("preserves the Ami Pulse location refresh after an admin password sign-in", async () => {
  const session = createSession("amritanshu99");
  loginWithPassword.mockResolvedValue(session);
  renderLogin();

  submitLogin("amritanshu99");

  await waitFor(() =>
    expect(updatePulseLocationFromBrowser).toHaveBeenCalledWith(session.token),
  );
  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Ami Pulse location updated to Greater Noida, India.",
    ),
  );
  expect(toast.info).toHaveBeenCalledWith(
    "Allow location access to refresh your Ami Pulse location.",
  );
});
