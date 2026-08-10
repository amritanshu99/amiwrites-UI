import { lazy } from "react";

export const createAdminRouteResource = (loadModule) => {
  let modulePromise = null;
  let loadedComponent = null;

  const load = () => {
    if (!modulePromise) {
      modulePromise = loadModule()
        .then((loadedModule) => {
          loadedComponent = loadedModule.default;
          return loadedModule;
        })
        .catch((error) => {
          modulePromise = null;
          throw error;
        });
    }

    return modulePromise;
  };

  return {
    load,
    getComponent: () => loadedComponent,
  };
};

export const createPreloadedRouteComponent = (resource) => {
  const LazyRoute = lazy(resource.load);

  return function PreloadedRouteComponent(props) {
    const LoadedRoute = resource.getComponent();
    return LoadedRoute ? <LoadedRoute {...props} /> : <LazyRoute {...props} />;
  };
};

export const addBlogRoute = createAdminRouteResource(() =>
  import("../pages/AddBlogDetails"),
);

export const amiPulseSettingsRoute = createAdminRouteResource(() =>
  import("../pages/PulseSettings"),
);

export const amiBotAdminRoute = createAdminRouteResource(() =>
  import("../pages/AmiBotAdmin"),
);

export const preloadAdminRoutes = () =>
  Promise.allSettled([
    addBlogRoute.load(),
    amiPulseSettingsRoute.load(),
    amiBotAdminRoute.load(),
  ]);
