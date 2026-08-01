import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useVerifiedAuth } from "./useVerifiedAuth";
import { verifyToken } from "../utils/authApi";

jest.mock("../utils/authApi", () => ({
  verifyToken: jest.fn(),
}));

const encodeJwtPart = (value) =>
  btoa(JSON.stringify(value))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createToken = (username) =>
  `${encodeJwtPart({ alg: "none", typ: "JWT" })}.${encodeJwtPart({
    username,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.test-signature`;

function AuthProbe({ label = "auth" }) {
  const auth = useVerifiedAuth();

  return (
    <div data-testid={label}>
      <span data-testid={`${label}-authenticated`}>
        {auth.isAuthenticated ? "yes" : "no"}
      </span>
      <span data-testid={`${label}-admin`}>{auth.isAdmin ? "yes" : "no"}</span>
      <span data-testid={`${label}-checking`}>
        {auth.isVerifyingAdmin ? "yes" : "no"}
      </span>
      <span data-testid={`${label}-username`}>{auth.username || "anonymous"}</span>
      <span data-testid={`${label}-verified-token`}>
        {auth.verifiedAdminToken || "none"}
      </span>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  verifyToken.mockReset();
});

test("keeps forged admin claims fail-closed unless verification returns boolean true", async () => {
  const token = createToken("amritanshu99");
  localStorage.setItem("token", token);
  verifyToken.mockResolvedValue("true");

  render(<AuthProbe />);

  expect(screen.getByTestId("auth-admin")).toHaveTextContent("no");
  await waitFor(() => expect(verifyToken).toHaveBeenCalledWith(token));
  await waitFor(() =>
    expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("no"),
  );
  expect(screen.getByTestId("auth-admin")).toHaveTextContent("no");
  expect(screen.getByTestId("auth-verified-token")).toHaveTextContent("none");
});

test("exposes admin state only after strict server verification and deduplicates consumers", async () => {
  const token = createToken("amritanshu99");
  localStorage.setItem("token", token);
  verifyToken.mockResolvedValue(true);

  render(
    <>
      <AuthProbe label="header" />
      <AuthProbe label="blogs" />
    </>,
  );

  expect(screen.getByTestId("header-admin")).toHaveTextContent("no");
  expect(screen.getByTestId("blogs-admin")).toHaveTextContent("no");

  await waitFor(() =>
    expect(screen.getByTestId("header-admin")).toHaveTextContent("yes"),
  );
  await waitFor(() =>
    expect(screen.getByTestId("blogs-admin")).toHaveTextContent("yes"),
  );

  expect(verifyToken).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("header-verified-token")).toHaveTextContent(token);
  expect(screen.getByTestId("blogs-verified-token")).toHaveTextContent(token);
});

test("ignores a late admin verification after tokenChanged replaces the token", async () => {
  const adminToken = createToken("amritanshu99");
  const userToken = createToken("reader");
  let resolveAdminVerification;

  localStorage.setItem("token", adminToken);
  verifyToken.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveAdminVerification = resolve;
      }),
  );

  render(<AuthProbe />);
  await waitFor(() => expect(verifyToken).toHaveBeenCalledWith(adminToken));

  act(() => {
    localStorage.setItem("token", userToken);
    window.dispatchEvent(new Event("tokenChanged"));
  });

  expect(screen.getByTestId("auth-username")).toHaveTextContent("reader");
  expect(screen.getByTestId("auth-admin")).toHaveTextContent("no");

  await act(async () => {
    resolveAdminVerification(true);
    await Promise.resolve();
  });

  expect(screen.getByTestId("auth-username")).toHaveTextContent("reader");
  expect(screen.getByTestId("auth-admin")).toHaveTextContent("no");
  expect(screen.getByTestId("auth-verified-token")).toHaveTextContent("none");
});

test("revokes verified admin UI on cross-tab token storage changes", async () => {
  const token = createToken("amritanshu99");
  localStorage.setItem("token", token);
  verifyToken.mockResolvedValue(true);

  render(<AuthProbe />);
  await waitFor(() =>
    expect(screen.getByTestId("auth-admin")).toHaveTextContent("yes"),
  );

  act(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "token",
        oldValue: token,
        newValue: null,
      }),
    );
  });

  expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("no");
  expect(screen.getByTestId("auth-admin")).toHaveTextContent("no");
  expect(screen.getByTestId("auth-username")).toHaveTextContent("anonymous");
});
