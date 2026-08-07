import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { toast } from "react-toastify";
import LoginModal from "./LoginModal";
import { updatePulseLocationFromBrowser } from "../../utils/pulseLocation";

jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("../../utils/pulseLocation", () => ({
  getGeolocationErrorMessage: jest.fn(() => "Location update failed."),
  updatePulseLocationFromBrowser: jest.fn(),
}));
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

const createToken = (username) =>
  `${encodeJwtPart({ alg: "HS256", typ: "JWT" })}.${encodeJwtPart({
    username,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.signature`;

function submitLogin(username) {
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  updatePulseLocationFromBrowser.mockResolvedValue({
    locationLabel: "Greater Noida, India",
  });
});

test("requests and updates Ami Pulse location after an admin login", async () => {
  const token = createToken("amritanshu99");
  const onClose = jest.fn();
  axios.post.mockResolvedValue({ data: { token } });

  render(<LoginModal isOpen onClose={onClose} />);
  submitLogin("amritanshu99");

  await waitFor(() =>
    expect(updatePulseLocationFromBrowser).toHaveBeenCalledWith(token),
  );
  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Ami Pulse location updated to Greater Noida, India.",
    ),
  );
  expect(localStorage.getItem("token")).toBe(token);
  expect(toast.info).toHaveBeenCalledWith(
    "Allow location access to refresh your Ami Pulse location.",
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("does not request location after a regular user login", async () => {
  const onClose = jest.fn();
  axios.post.mockResolvedValue({ data: { token: createToken("reader") } });

  render(<LoginModal isOpen onClose={onClose} />);
  submitLogin("reader");

  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(updatePulseLocationFromBrowser).not.toHaveBeenCalled();
  expect(toast.info).not.toHaveBeenCalled();
});
