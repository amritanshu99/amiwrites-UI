import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { toast } from "react-toastify";
import Footer from "../Layout/Footer";
import { apiUrl } from "../../config/api";
import ContactMeButton from "./ContactMeButton";

let mockPathname = "/";
const mockNavigate = jest.fn();

jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useLocation: () => ({ pathname: mockPathname }),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);
jest.mock("../Loader/Loader", () => () => null);

const renderContact = () => render(<ContactMeButton />);

describe("ContactMeButton", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockNavigate.mockReset();
    axios.post.mockReset();
    toast.success.mockClear();
    toast.error.mockClear();
    window.scrollTo = jest.fn();
    window.Audio = jest.fn(() => ({
      currentTime: 0,
      load: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a compact mobile trigger without changing desktop expansion classes", () => {
    jest.useFakeTimers();
    renderContact();

    const trigger = screen.getByRole("button", { name: "Contact Me" });
    expect(trigger).toHaveClass("inline-flex", "w-14", "md:w-40");
    expect(trigger).not.toHaveClass("hidden");
    expect(screen.getByText("Contact Me")).toHaveClass("hidden", "md:inline");

    act(() => jest.advanceTimersByTime(2100));
    expect(trigger).toHaveClass("w-14");
  });

  it("opens the contact form from the mobile trigger", () => {
    renderContact();

    fireEvent.click(screen.getByRole("button", { name: "Contact Me" }));

    expect(
      screen.getByRole("heading", { name: "Let's Connect" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("submits the contact endpoint payload and closes after a successful response", async () => {
    axios.post.mockResolvedValueOnce({ status: 200 });
    renderContact();

    fireEvent.click(screen.getByRole("button", { name: "Contact Me" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Reason to Connect"), {
      target: { value: "Build a thoughtful AI product" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(apiUrl("/api/contact"), {
        name: "Ada Lovelace",
        email: "ada@example.com",
        reason: "Build a thoughtful AI product",
      }),
    );
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Your request is submitted. We will get back to you shortly.",
      );
      expect(
        screen.queryByRole("heading", { name: "Let's Connect" }),
      ).not.toBeInTheDocument();
    });
  });

  it.each(["/amibot", "/amibot-admin"])(
    "opens Footer Contact in place while hiding the floating trigger on %s",
    (initialEntry) => {
      mockPathname = initialEntry;
      render(
        <>
          <ContactMeButton />
          <Footer />
        </>,
      );

      expect(screen.queryByRole("button", { name: "Contact Me" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Contact" }));

      expect(
        screen.getByRole("heading", { name: "Let's Connect" }),
      ).toBeInTheDocument();
      expect(mockPathname).toBe(initialEntry);
      expect(mockNavigate).not.toHaveBeenCalled();
    },
  );
});
