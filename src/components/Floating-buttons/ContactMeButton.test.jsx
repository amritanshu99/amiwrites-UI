import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ContactMeButton from "./ContactMeButton";

const mockNavigate = jest.fn();

jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock(
  "react-router-dom",
  () => ({
    useLocation: () => ({ pathname: "/" }),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);
jest.mock("../Loader/Loader", () => () => null);

describe("ContactMeButton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockReset();
    window.Audio = jest.fn(() => ({
      currentTime: 0,
      load: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it("renders a compact mobile trigger without changing desktop expansion classes", () => {
    render(<ContactMeButton />);

    const trigger = screen.getByRole("button", { name: "Contact Me" });
    expect(trigger).toHaveClass("inline-flex", "w-14", "md:w-40");
    expect(trigger).not.toHaveClass("hidden");
    expect(screen.getByText("Contact Me")).toHaveClass("hidden", "md:inline");

    act(() => jest.advanceTimersByTime(2100));
    expect(trigger).toHaveClass("w-14");
  });

  it("opens the contact form from the mobile trigger", () => {
    render(<ContactMeButton />);

    fireEvent.click(screen.getByRole("button", { name: "Contact Me" }));

    expect(
      screen.getByRole("heading", { name: "Let's Connect" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});
