import axios from "axios";
import {
  continueWithGoogle,
  loginWithPassword,
  verifyToken,
} from "./authApi";

jest.mock("axios", () => ({
  post: jest.fn(),
}));

beforeEach(() => {
  axios.post.mockReset();
});

const encodeJwtPart = (value) =>
  btoa(JSON.stringify(value))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createToken = (username = "reader") =>
  `${encodeJwtPart({ alg: "HS256", typ: "JWT" })}.${encodeJwtPart({
    username,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.signature`;

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

test("normalizes password login input and requires a valid app JWT response", async () => {
  const token = createToken();
  axios.post.mockResolvedValueOnce({ data: { token, user: { username: "reader" } } });

  await expect(
    loginWithPassword({ identifier: " reader@example.com ", password: "secret" }),
  ).resolves.toMatchObject({
    token,
    payload: expect.objectContaining({ username: "reader" }),
  });
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/auth/login"),
    { identifier: "reader@example.com", password: "secret" },
    { timeout: 10000 },
  );

  axios.post.mockResolvedValueOnce({ data: { token: "google-id-token" } });
  await expect(
    loginWithPassword({ identifier: "reader", password: "secret" }),
  ).rejects.toMatchObject({ code: "INVALID_AUTH_RESPONSE" });
});

test("preserves Google account-link details and sends the retained credential on retry", async () => {
  axios.post.mockRejectedValueOnce({
    response: {
      status: 409,
      data: {
        code: "ACCOUNT_LINK_REQUIRED",
        message: "Link required",
        email: "reader@example.com",
      },
    },
  });

  await expect(
    continueWithGoogle({ credential: "google-credential" }),
  ).rejects.toMatchObject({
    code: "ACCOUNT_LINK_REQUIRED",
    email: "reader@example.com",
    status: 409,
  });

  const token = createToken();
  axios.post.mockResolvedValueOnce({ data: { token } });
  await continueWithGoogle({
    credential: "google-credential",
    password: "current-password",
  });
  expect(axios.post).toHaveBeenLastCalledWith(
    expect.stringContaining("/api/auth/google"),
    { credential: "google-credential", password: "current-password" },
    { timeout: 10000 },
  );
});
