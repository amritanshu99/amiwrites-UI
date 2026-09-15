import {
  getObjectFitRect,
  relaxPixelField,
} from "./HeroPixelDistortion";

describe("HeroPixelDistortion math", () => {
  it("matches centered object-cover image cropping", () => {
    expect(
      getObjectFitRect({
        containerHeight: 100,
        containerWidth: 100,
        imageHeight: 100,
        imageWidth: 200,
        objectFit: "cover",
        objectPosition: "50% 50%",
      }),
    ).toEqual({ height: 100, width: 200, x: -50, y: 0 });
  });

  it("matches contained images with keyword positioning", () => {
    expect(
      getObjectFitRect({
        containerHeight: 200,
        containerWidth: 200,
        imageHeight: 50,
        imageWidth: 100,
        objectFit: "contain",
        objectPosition: "right bottom",
      }),
    ).toEqual({ height: 100, width: 200, x: 0, y: 100 });
  });

  it("returns an empty rect for an unavailable image", () => {
    expect(
      getObjectFitRect({
        containerHeight: 200,
        containerWidth: 200,
        imageHeight: 0,
        imageWidth: 0,
        objectFit: "cover",
      }),
    ).toEqual({ height: 0, width: 0, x: 0, y: 0 });
  });

  it("relaxes displacement at a frame-rate-independent rate", () => {
    const field = new Float32Array([10, -5, 0.05, 0]);

    expect(relaxPixelField(field, 2)).toBeCloseTo(8.1);
    expect(field[0]).toBeCloseTo(8.1);
    expect(field[1]).toBeCloseTo(-4.05);
    expect(field[2]).toBe(0);
  });
});
