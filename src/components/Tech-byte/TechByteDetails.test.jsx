import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const originalMatchMedia = window.matchMedia;

function installMatchMedia(matches) {
  const listeners = new Set();
  const mediaQuery = {
    matches,
    media: "(min-width: 768px)",
    onchange: null,
    addEventListener: jest.fn((type, listener) => {
      if (type === "change") listeners.add(listener);
    }),
    removeEventListener: jest.fn((type, listener) => {
      if (type === "change") listeners.delete(listener);
    }),
    addListener: jest.fn((listener) => listeners.add(listener)),
    removeListener: jest.fn((listener) => listeners.delete(listener)),
    dispatchEvent: jest.fn((event) => {
      listeners.forEach((listener) => listener(event));
      return true;
    }),
  };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => mediaQuery),
    writable: true,
  });

  return mediaQuery;
}

describe("TechByteDetails responsive readers", () => {
  beforeEach(() => {
    axios.get.mockReset();
    document.body.classList.remove(
      "tech-byte-reader-active",
      "tech-byte-swipe-active",
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.classList.remove(
      "tech-byte-reader-active",
      "tech-byte-swipe-active",
    );

    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
        writable: true,
      });
    } else {
      delete window.matchMedia;
    }
  });

  test("renders only the desktop scroll reader on desktop", async () => {
    const mediaQuery = installMatchMedia(true);
    axios.get.mockResolvedValue({ data: { articles: apiArticles } });
    const openArticle = jest.spyOn(window, "open").mockImplementation(() => null);

    const { unmount } = render(<TechByteDetails />);

    expect(await screen.findByText("3 stories")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/tech-news", {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByTestId("tech-byte-reader-shell")).toHaveAttribute(
      "data-reader-kind",
      "scroll",
    );
    expect(
      screen.getByLabelText("Tech news scroll reader"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Tech news swipe deck"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Choose Tech Byte view" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Feed" }),
    ).not.toBeInTheDocument();
    expect(document.body).toHaveClass("tech-byte-reader-active");
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

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

    unmount();
    expect(document.body).not.toHaveClass("tech-byte-reader-active");
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  test("renders only the mobile swipe reader on mobile", async () => {
    installMatchMedia(false);
    axios.get.mockResolvedValue({ data: { articles: apiArticles } });

    const { unmount } = render(<TechByteDetails />);

    expect(
      await screen.findByLabelText("Tech news swipe deck"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tech-byte-reader-shell")).toHaveAttribute(
      "data-reader-kind",
      "swipe",
    );
    expect(
      screen.queryByLabelText("Tech news scroll reader"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Choose Tech Byte view" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Swipe reader" }),
    ).not.toBeInTheDocument();
    expect(document.body).toHaveClass("tech-byte-reader-active");

    unmount();
    expect(document.body).not.toHaveClass("tech-byte-reader-active");
  });

  test("shows the correct reader after a failed request is retried", async () => {
    installMatchMedia(true);
    axios.get
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ data: { articles: apiArticles } });

    render(<TechByteDetails />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The news feed is taking a break",
    );
    expect(
      screen.queryByLabelText("Tech news scroll reader"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Tech news swipe deck"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("3 stories")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Tech news scroll reader"),
    ).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });
});
