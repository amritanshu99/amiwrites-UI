import axios from "axios";
import { verifyToken } from "./authApi";

jest.mock("axios", () => ({
  post: jest.fn(),
}));

beforeEach(() => {
  axios.post.mockReset();
});

test("accepts only an explicit boolean true verification response", async () => {
  axios.post.mockResolvedValueOnce({ data: { valid: "true" } });
  await expect(verifyToken("header.payload.signature")).resolves.toBe(false);

  axios.post.mockResolvedValueOnce({ data: { valid: true } });
  await expect(verifyToken("header.payload.signature")).resolves.toBe(true);
  expect(axios.post.mock.calls[1][2]).toMatchObject({ timeout: 10000 });
});

test("rejects malformed or oversized tokens without a request", async () => {
  await expect(verifyToken(42)).resolves.toBe(false);
  await expect(verifyToken("x".repeat(8193))).resolves.toBe(false);
  expect(axios.post).not.toHaveBeenCalled();
});
