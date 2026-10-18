import { navigateVoicePage, readVoiceContext, clearVoiceContext } from "./voiceNavigation";

afterEach(() => { sessionStorage.clear(); jest.restoreAllMocks(); });
test("guest conversation survives the isolated voice navigation and is cleared on arrival", () => {
  const messages = [{ sender: "user", text: "My follow-up question" }], navigate = jest.fn();
  navigateVoicePage("/amibot/voice", messages, false, navigate);
  expect(navigate).toHaveBeenCalledWith("/amibot/voice");
  expect(readVoiceContext()).toEqual(messages);
  expect(readVoiceContext()).toEqual(messages); // Safe with React StrictMode initialization.
  clearVoiceContext();
  expect(readVoiceContext()).toBeNull();
});
test("authenticated history is not copied into temporary browser storage", () => {
  navigateVoicePage("/amibot/voice", [{ sender: "user", text: "Private" }], true, jest.fn());
  expect(sessionStorage.length).toBe(0);
});
test("stale guest handoff is ignored", () => {
  navigateVoicePage("/amibot/voice", [{ sender: "user", text: "Old" }], false, jest.fn());
  jest.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60 * 1000);
  expect(readVoiceContext()).toBeNull();
});
