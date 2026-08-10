import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import { useVerifiedAuth } from "../hooks/useVerifiedAuth";
import { verifyToken } from "../utils/authApi";

jest.mock(
  "react-router-dom",
  () => ({
    Navigate: ({ to }) => <div data-testid="redirect">{to}</div>,
  }),
  { virtual: true },
);

jest.mock("../utils/authApi", () => ({
  verifyToken: jest.fn(),
}));

const encodeJwtPart = (value) =>
  btoa(JSON.stringify(value))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createToken = () =>
  `${encodeJwtPart({ alg: "none", typ: "JWT" })}.${encodeJwtPart({
    username: "amritanshu99",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.protected-route-test`;

function HeaderAuthProbe() {
  const { isAdmin } = useVerifiedAuth();
  return <div data-testid="header-admin">{isAdmin ? "yes" : "no"}</div>;
}

function AuthenticatedApp({ showAdminRoute }) {
  return (
    <>
      <HeaderAuthProbe />
      {showAdminRoute ? (
        <ProtectedAdminRoute loadingLabel="Loading Create Blog">
          <div>Editor ready</div>
        </ProtectedAdminRoute>
      ) : null}
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  verifyToken.mockReset();
});

test("reuses the header verification synchronously when an admin route mounts", async () => {
  const token = createToken();
  localStorage.setItem("token", token);
  verifyToken.mockResolvedValue(true);

  const { rerender } = render(<AuthenticatedApp showAdminRoute={false} />);

  await waitFor(() =>
    expect(screen.getByTestId("header-admin")).toHaveTextContent("yes"),
  );
  expect(verifyToken).toHaveBeenCalledTimes(1);

  rerender(<AuthenticatedApp showAdminRoute />);

  expect(screen.getByText("Editor ready")).toBeInTheDocument();
  expect(
    screen.queryByRole("status", { name: "Loading Create Blog" }),
  ).not.toBeInTheDocument();

  await waitFor(() => expect(verifyToken).toHaveBeenCalledTimes(1));
});
