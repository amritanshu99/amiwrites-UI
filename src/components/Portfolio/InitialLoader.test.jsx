import { render, screen } from "@testing-library/react";
import InitialLoader from "./InitialLoader";

test("always shows the written and directed credit in showcase mode", () => {
  const firstVisit = render(<InitialLoader />);

  expect(
    screen.getByText("Written & Directed by Amritanshu Mishra"),
  ).toBeInTheDocument();

  firstVisit.unmount();
  render(<InitialLoader />);

  expect(
    screen.getByText("Written & Directed by Amritanshu Mishra"),
  ).toBeInTheDocument();
});
