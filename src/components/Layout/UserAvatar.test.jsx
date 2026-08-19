import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import UserAvatar from "./UserAvatar";

test("requests a higher-resolution Google avatar with accessible profile text", () => {
  render(
    <UserAvatar
      avatarUrl="https://lh3.googleusercontent.com/a/profile-photo=s96-c"
      displayName="Alice Reader"
      username="alice"
    />,
  );

  const image = screen.getByRole("img", {
    name: "Alice Reader's profile picture",
  });
  expect(image).toHaveAttribute(
    "src",
    "https://lh3.googleusercontent.com/a/profile-photo=s256-c",
  );
  expect(image).toHaveAttribute("width", "32");
  expect(image).toHaveAttribute("height", "32");
  expect(image).toHaveAttribute("referrerpolicy", "no-referrer");

  fireEvent.load(image);
  expect(image).toHaveClass("opacity-100");
});

test("accepts an HTTPS ggpht avatar using the same strict hostname boundary", () => {
  render(
    <UserAvatar
      avatarUrl="https://lh3.ggpht.com/a/profile-photo=s96-c"
      displayName="Grace Reader"
      username="grace"
    />,
  );

  expect(
    screen.getByRole("img", { name: "Grace Reader's profile picture" }),
  ).toHaveAttribute("src", "https://lh3.ggpht.com/a/profile-photo=s256-c");
});

test("falls back locally when the Google image fails", () => {
  render(
    <UserAvatar
      avatarUrl="https://lh3.googleusercontent.com/a/profile-photo=s96-c"
      displayName="Alice Reader"
      username="alice"
    />,
  );

  fireEvent.error(screen.getByRole("img"));

  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByTestId("user-avatar-fallback")).toHaveTextContent("A");
});

test.each([
  "https://googleusercontent.com.evil.example/avatar=s96-c",
  "https://ggpht.com.evil.example/avatar=s96-c",
  "http://lh3.googleusercontent.com/avatar=s96-c",
  "javascript:alert(1)",
])("never renders a network image for an untrusted avatar URL: %s", (avatarUrl) => {
  render(
    <UserAvatar avatarUrl={avatarUrl} displayName="Alice Reader" username="alice" />,
  );

  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByTestId("user-avatar-fallback")).toHaveTextContent("A");
});
