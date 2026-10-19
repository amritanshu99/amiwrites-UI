import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AmiBotVoice from "./AmiBotVoice";
import useAmiBotVoice from "./useAmiBotVoice";

jest.mock("./useAmiBotVoice", () => jest.fn());
beforeEach(() => {
  window.webkitSpeechRecognition = jest.fn();
  jest.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; SM-G990B) Chrome/130 Mobile");
  useAmiBotVoice.mockReturnValue({ phase: "idle", supported: true, status: { ready: true }, start: jest.fn(), level: 0 });
});
afterEach(() => { delete window.webkitSpeechRecognition; jest.restoreAllMocks(); });

test("mobile defaults to browser input, discloses the audio destination, and requires explicit consent", () => {
  render(<AmiBotVoice onClose={jest.fn()} onTurn={jest.fn()} />);
  expect(screen.getByLabelText("Speech recognition")).toHaveValue("browser");
  expect(screen.getByRole("button", { name: "Download & start" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/Download about/));
  expect(screen.getByRole("button", { name: "Download & start" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/Allow my browser's speech service/));
  expect(screen.getByRole("button", { name: "Download & start" })).toBeEnabled();
  expect(useAmiBotVoice).toHaveBeenLastCalledWith(expect.objectContaining({ recognitionMode: "browser", browserSpeechAccepted: true }));
  expect(screen.queryByText(/Audio stays on your device/)).not.toBeInTheDocument();
});

test("on-device input remains available without permission to send audio to a browser service", () => {
  render(<AmiBotVoice onClose={jest.fn()} onTurn={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Speech recognition"), { target: { value: "local" } });
  expect(screen.queryByLabelText(/Allow my browser's speech service/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Speaking language")).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/Download about/));
  expect(screen.getByRole("button", { name: "Download & start" })).toBeEnabled();
  expect(useAmiBotVoice).toHaveBeenLastCalledWith(expect.objectContaining({ recognitionMode: "local", browserSpeechAccepted: false }));
});
