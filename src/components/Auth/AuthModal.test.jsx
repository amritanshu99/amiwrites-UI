import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthModal from "./AuthModal";
import {
  continueWithGoogle,
  loginWithPassword,
  signupWithPassword,
} from "../../utils/authApi";
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
jest.mock("./GoogleSignInButton", () => ({
  disabled,
  mode,
  onCredential,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onCredential("google-id-credential")}
  >
    Google {mode}
  </button>
));
jest.mock("./Modal", () => ({ isOpen, children, title }) =>
  isOpen ? (
    <div role="dialog" aria-label={title}>
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

const renderAuth = ({ initialMode = "signin", onClose = jest.fn() } = {}) => {
  render(<AuthModal isOpen initialMode={initialMode} onClose={onClose} />);
  return onClose;
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  updatePulseLocationFromBrowser.mockResolvedValue({ locationLabel: "Noida, India" });
});

test("switches between sign-in and account creation inside one dialog", () => {
  renderAuth();

  fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
  expect(screen.getByRole("dialog", { name: "Create your account" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Username")).toBeInTheDocument();
  expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: "Sign in" }));
  expect(screen.getByRole("dialog", { name: "Welcome back" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
});

test("creates an account only after backend-aligned password checks and confirmation", async () => {
  const session = createSession("new-reader");
  signupWithPassword.mockResolvedValue(session);
  renderAuth({ initialMode: "signup" });

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: " New@Example.com " },
  });
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: " new-reader " },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Strongpass1!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "Strongpass1!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  await waitFor(() =>
    expect(signupWithPassword).toHaveBeenCalledWith({
      email: "new@example.com",
      username: "new-reader",
      password: "Strongpass1!",
    }),
  );
  expect(localStorage.getItem("token")).toBe(session.token);
});

test("commits a Google app session and preserves admin Ami Pulse behavior", async () => {
  const session = createSession("amritanshu99");
  continueWithGoogle.mockResolvedValue(session);
  renderAuth();

  fireEvent.click(screen.getByRole("button", { name: "Google signin" }));

  await waitFor(() =>
    expect(continueWithGoogle).toHaveBeenCalledWith({
      credential: "google-id-credential",
    }),
  );
  expect(localStorage.getItem("token")).toBe(session.token);
  await waitFor(() =>
    expect(updatePulseLocationFromBrowser).toHaveBeenCalledWith(session.token),
  );
});

test("retains the Google credential for one-time legacy account linking", async () => {
  const session = createSession("legacy-reader");
  continueWithGoogle
    .mockRejectedValueOnce({
      code: "ACCOUNT_LINK_REQUIRED",
      email: "legacy@example.com",
      message: "Verify your existing account password",
    })
    .mockResolvedValueOnce(session);
  renderAuth();

  fireEvent.click(screen.getByRole("button", { name: "Google signin" }));

  const passwordInput = await screen.findByLabelText("Current Amiverse password");
  expect(screen.getByLabelText("Email or username")).toHaveValue("legacy@example.com");
  expect(screen.getByLabelText("Email or username")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Use password sign-in without linking" }),
  ).toBeInTheDocument();

  fireEvent.change(passwordInput, { target: { value: "Legacypass1!" } });
  fireEvent.click(screen.getByRole("button", { name: "Verify & link Google" }));

  await waitFor(() =>
    expect(continueWithGoogle).toHaveBeenLastCalledWith({
      credential: "google-id-credential",
      password: "Legacypass1!",
    }),
  );
  expect(localStorage.getItem("token")).toBe(session.token);
  expect(loginWithPassword).not.toHaveBeenCalled();
});
