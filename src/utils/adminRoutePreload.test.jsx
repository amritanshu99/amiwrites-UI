import React, { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import {
  createAdminRouteResource,
  createPreloadedRouteComponent,
} from "./adminRoutePreload";

test("renders an already preloaded admin route without committing a fallback", async () => {
  const RouteContent = () => <div>Admin page ready</div>;
  const resource = createAdminRouteResource(() =>
    Promise.resolve({ default: RouteContent }),
  );
  const PreloadedRoute = createPreloadedRouteComponent(resource);

  await resource.load();

  render(
    <Suspense fallback={<div>Route fallback</div>}>
      <PreloadedRoute />
    </Suspense>,
  );

  expect(screen.getByText("Admin page ready")).toBeInTheDocument();
  expect(screen.queryByText("Route fallback")).not.toBeInTheDocument();
});
