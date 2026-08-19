import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import GoogleSignInButton from "./GoogleSignInButton";

const originalClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

afterEach(() => {
  if (originalClientId === undefined) {
    delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
  } else {
    process.env.REACT_APP_GOOGLE_CLIENT_ID = originalClientId;
  }
  delete window.google;
});

test("renders the official GIS button and forwards its credential", async () => {
  process.env.REACT_APP_GOOGLE_CLIENT_ID = "web-client.apps.googleusercontent.com";
  const initialize = jest.fn();
  const renderButton = jest.fn();
  const onCredential = jest.fn();
  window.google = {
    accounts: {
      id: { initialize, renderButton },
    },
  };

  render(
    <GoogleSignInButton mode="signup" onCredential={onCredential} onError={jest.fn()} />,
  );

  await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(1));
  expect(initialize).toHaveBeenCalledWith(
    expect.objectContaining({
      client_id: "web-client.apps.googleusercontent.com",
      ux_mode: "popup",
    }),
  );
  expect(renderButton.mock.calls[0][1]).toMatchObject({
    type: "standard",
    text: "signup_with",
  });

  act(() => {
    initialize.mock.calls[0][0].callback({ credential: "google-id-token" });
  });
  expect(onCredential).toHaveBeenCalledWith("google-id-token");
});
