import {
  getGeolocationErrorMessage,
  updatePulseLocationFromBrowser,
} from "./pulseLocation";

jest.mock("axios", () => ({ get: jest.fn(), put: jest.fn() }));

const TOKEN = "header.payload.signature";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", TOKEN);
});

test("detects, reverse-geocodes, and saves the current Ami Pulse location", async () => {
  const geolocation = {
    getCurrentPosition: jest.fn((resolve) =>
      resolve({
        coords: {
          latitude: 28.47438742,
          longitude: 77.50399061,
        },
      }),
    ),
  };
  const client = {
    get: jest.fn().mockResolvedValue({
      data: {
        data: {
          ownerCity: "Greater Noida",
          ownerRegion: "Uttar Pradesh",
          ownerCountry: "India",
          locationLabel: "Greater Noida, India",
        },
      },
    }),
    put: jest.fn().mockResolvedValue({ data: { success: true } }),
  };

  const result = await updatePulseLocationFromBrowser(TOKEN, {
    geolocation,
    client,
  });

  expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(
    expect.any(Function),
    expect.any(Function),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
  expect(client.get).toHaveBeenCalledWith(
    expect.stringContaining("/api/pulse/admin/reverse-geocode"),
    expect.objectContaining({
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { lat: 28.474387, lon: 77.503991 },
    }),
  );
  expect(client.put).toHaveBeenCalledWith(
    expect.stringContaining("/api/pulse/admin"),
    expect.objectContaining({
      ownerLatitude: 28.474387,
      ownerLongitude: 77.503991,
      ownerCity: "Greater Noida",
      ownerRegion: "Uttar Pradesh",
      ownerCountry: "India",
      locationLabel: "Greater Noida, India",
    }),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: `Bearer ${TOKEN}`,
      }),
    }),
  );
  expect(result.locationLabel).toBe("Greater Noida, India");
});

test("does not call Ami Pulse APIs when location permission is denied", async () => {
  const permissionError = {
    code: 1,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  };
  const geolocation = {
    getCurrentPosition: jest.fn((resolve, reject) => reject(permissionError)),
  };
  const client = { get: jest.fn(), put: jest.fn() };

  await expect(
    updatePulseLocationFromBrowser(TOKEN, { geolocation, client }),
  ).rejects.toBe(permissionError);

  expect(client.get).not.toHaveBeenCalled();
  expect(client.put).not.toHaveBeenCalled();
  expect(getGeolocationErrorMessage(permissionError)).toMatch(/permission was denied/i);
});

test("does not overwrite Ami Pulse when reverse geocoding fails", async () => {
  const geolocation = {
    getCurrentPosition: jest.fn((resolve) =>
      resolve({ coords: { latitude: 28.47, longitude: 77.5 } }),
    ),
  };
  const client = {
    get: jest.fn().mockRejectedValue(new Error("lookup unavailable")),
    put: jest.fn(),
  };

  let error;
  try {
    await updatePulseLocationFromBrowser(TOKEN, { geolocation, client });
  } catch (caughtError) {
    error = caughtError;
  }

  expect(error?.pulseLocationCode).toBe("lookup-failed");
  expect(client.put).not.toHaveBeenCalled();
  expect(getGeolocationErrorMessage(error)).toMatch(/was not changed/i);
});
