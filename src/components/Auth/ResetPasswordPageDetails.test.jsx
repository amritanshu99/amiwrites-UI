import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { toast } from "react-toastify";
import ResetPasswordPageDetails from "./ResetPasswordPageDetails";

const mockNavigate = jest.fn();

jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));
jest.mock("../Loader/Loader", () => () => <div>Resetting password</div>);

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test("clears a revoked session and notifies auth consumers after reset", async () => {
  axios.post.mockResolvedValue({ data: { message: "Password reset" } });
  localStorage.setItem("token", "previous-session-token");
  const handleTokenChanged = jest.fn();
  window.addEventListener("tokenChanged", handleTokenChanged);

  render(<ResetPasswordPageDetails token="valid-reset-token" />);
  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "Strongpass1!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "Strongpass1!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  expect(localStorage.getItem("token")).toBeNull();
  expect(handleTokenChanged).toHaveBeenCalledTimes(1);
  expect(toast.success).toHaveBeenCalledWith(
    "Password reset successful! Please login.",
  );

  window.removeEventListener("tokenChanged", handleTokenChanged);
});

test("rejects passwords that exceed bcrypt's 72-byte limit", () => {
  const oversizedPassword = `${"😀".repeat(18)}1!`;
  render(<ResetPasswordPageDetails token="valid-reset-token" />);

  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: oversizedPassword },
  });
  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: oversizedPassword },
  });
  fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

  expect(axios.post).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(
    expect.stringContaining("72 bytes"),
  );
});
