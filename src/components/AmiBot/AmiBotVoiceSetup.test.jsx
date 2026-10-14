import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AmiBotVoiceSetup from "./AmiBotVoiceSetup";
import { normalizeReference } from "./browserVoiceAudio";

jest.mock("../../config/api", () => ({ apiUrl: (path) => path }));
jest.mock("./browserVoiceAudio", () => ({ normalizeReference: jest.fn() }));

beforeEach(() => {
  localStorage.setItem("token", "test-admin-token");
  URL.createObjectURL = jest.fn(() => "blob:local-preview");
  URL.revokeObjectURL = jest.fn();
  normalizeReference.mockResolvedValue(new Blob(["normalized WAV"], { type: "audio/wav" }));
  global.fetch = jest.fn(async (url, options) => ({ ok: true, json: async () => options?.method === "POST" ? { duration: 6, referenceReady: true } : { ready: false } }));
});
afterEach(() => { localStorage.clear(); jest.clearAllMocks(); });

function chooseSample() {
  fireEvent.change(screen.getByLabelText("Voice reference recording"), { target: { files: [new File(["recording"], "voice.webm", { type: "audio/webm" })] } });
}

test("public voice publication needs both consents and uploads normalized audio with admin auth", async () => {
  const { unmount } = render(<AmiBotVoiceSetup />);
  await screen.findByText(/Save your voice below/);
  chooseSample();
  const save = screen.getByRole("button", { name: "Save AmiBot voice" });
  fireEvent.click(screen.getByLabelText(/This is my voice/));
  expect(save).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/this recording is public/));
  expect(save).toBeEnabled();
  fireEvent.click(save);
  await screen.findByText(/Voice saved \(6s\)/);
  const [url, options] = global.fetch.mock.calls.find(([, value]) => value?.method === "POST");
  expect(url).toBe("/api/amibot/admin/voice/browser/reference");
  expect(options.headers.Authorization).toBe("Bearer test-admin-token");
  expect(options.body.get("audio").type).toBe("audio/wav");
  expect(options.body.get("consent")).toBe("true");
  expect(options.body.get("browserSharingConsent")).toBe("true");
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview");
});

test("an invalid reference is reported without uploading it", async () => {
  normalizeReference.mockRejectedValueOnce(new Error("Record at least 5 seconds of your voice."));
  render(<AmiBotVoiceSetup />);
  await screen.findByText(/Save your voice below/);
  chooseSample();
  fireEvent.click(screen.getByLabelText(/This is my voice/));
  fireEvent.click(screen.getByLabelText(/this recording is public/));
  fireEvent.click(screen.getByRole("button", { name: "Save AmiBot voice" }));
  await screen.findByText(/Record at least 5 seconds/);
  await waitFor(() => expect(screen.getByRole("button", { name: "Save AmiBot voice" })).toBeEnabled());
  expect(global.fetch.mock.calls.some(([, options]) => options?.method === "POST")).toBe(false);
});
