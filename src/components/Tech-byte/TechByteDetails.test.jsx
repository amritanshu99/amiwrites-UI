import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import TechByteDetails from "./TechByteDetails";

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: () => ({ pathname: "/tech-byte" }),
  }),
  { virtual: true },
);

jest.mock("../../config/api", () => ({
  apiUrl: (path) => path,
}));

jest.mock("framer-motion", () => ({
  useReducedMotion: () => false,
}));

const apiArticles = [
  {
    url: "https://news.example.com/one",
    image: "https://images.example.com/one.jpg",
    title: "Smaller AI models move onto phones",
    description: "New chips make more private on-device assistants practical.",
    publishedAt: "2026-08-25T08:00:00.000Z",
    source: {
      name: "Circuit Daily",
      url: "https://source.example.com/circuit",
    },
  },
  {
    url: "https://news.example.com/two",
    image: "https://images.example.com/two.jpg",
    title: "Battery research reaches a new milestone",
    description: "A revised chemistry promises longer-lived devices.",
    publishedAt: "2026-08-25T09:00:00.000Z",
    source: {
      name: "Future Wire",
      url: "https://source.example.com/future",
    },
  },
  {
    url: "https://news.example.com/three",
    image: "https://images.example.com/three.jpg",
    title: "Open source robotics gets easier to use",
    description: "A new toolkit reduces the setup needed for small robots.",
    publishedAt: "2026-08-25T10:00:00.000Z",
    source: {
      name: "Robot Review",
      url: "https://source.example.com/robot",
    },
  },
];

describe("TechByteDetails view modes", () => {
  beforeEach(() => {
    axios.get.mockReset();
    document.body.classList.remove("tech-byte-swipe-active");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.classList.remove("tech-byte-swipe-active");
  });

  test("switches between the mobile feed and swipe reader while retaining the desktop feed", async () => {
    axios.get.mockResolvedValue({ data: { articles: apiArticles } });
    const openArticle = jest.spyOn(window, "open").mockImplementation(() => null);

    render(<TechByteDetails />);

    expect(await screen.findByText("3 stories")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/tech-news", {
      signal: expect.any(AbortSignal),
    });

    const switcher = screen.getByRole("group", {
      name: "Choose Tech Byte view",
    });
    const feedButton = within(switcher).getByRole("button", { name: "Feed" });
    const swipeButton = within(switcher).getByRole("button", {
      name: "Swipe reader",
    });
    const feedView = screen.getByTestId("tech-byte-feed-view");

    expect(switcher).toHaveClass("md:hidden");
    expect(feedButton).toHaveAttribute("aria-pressed", "true");
    expect(swipeButton).toHaveAttribute("aria-pressed", "false");
    expect(feedView).toHaveClass("grid");

    fireEvent.click(swipeButton);

    expect(feedButton).toHaveAttribute("aria-pressed", "false");
    expect(swipeButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Tech news swipe deck")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Story 1 of 3");
    expect(feedView).toHaveClass("hidden", "md:grid");
    expect(document.body).toHaveClass("tech-byte-swipe-active");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Read full story: Smaller AI models move onto phones",
      }),
    );
    expect(openArticle).toHaveBeenCalledWith(
      "https://news.example.com/one",
      "_blank",
      "noopener,noreferrer",
    );

    fireEvent.click(feedButton);

    expect(screen.queryByLabelText("Tech news swipe deck")).not.toBeInTheDocument();
    expect(feedButton).toHaveAttribute("aria-pressed", "true");
    expect(feedView).toHaveClass("grid");
    expect(document.body).not.toHaveClass("tech-byte-swipe-active");
  });

  test("keeps view controls unavailable on failure and enables them after retry", async () => {
    axios.get
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ data: { articles: apiArticles } });

    render(<TechByteDetails />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The news feed is taking a break",
    );

    const switcher = screen.getByRole("group", {
      name: "Choose Tech Byte view",
    });
    const feedButton = within(switcher).getByRole("button", { name: "Feed" });
    const swipeButton = within(switcher).getByRole("button", {
      name: "Swipe reader",
    });

    expect(feedButton).toBeDisabled();
    expect(swipeButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("3 stories")).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    expect(feedButton).toBeEnabled();
    expect(swipeButton).toBeEnabled();
  });
});
