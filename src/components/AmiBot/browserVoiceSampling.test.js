import { speechTokenPenalty } from "./browserVoiceSampling";

test("prompt text never suppresses speech tokens sharing the same numeric ID", () => {
  const scores = new Float32Array([2, 4, -3, 8]);
  const logits = [{ data: scores }];
  const process = speechTokenPenalty(3, 2);
  expect(process([[0n, 1n, 2n]], logits)).toBe(logits);
  expect([...scores]).toEqual([2, 4, -3, 8]);
  process([[0n, 1n, 2n, 1n, 1n, 2n]], logits);
  expect([...scores]).toEqual([2, 2, -6, 8]);
});

test("speech penalties stay within each batch and ignore out-of-vocabulary IDs", () => {
  const logits = [{ data: new Float32Array([4, 6]) }, { data: new Float32Array([8, 10]) }];
  speechTokenPenalty(1, 2)([[1n, 0n, 50256n], [0n, 1n]], logits);
  expect([...logits[0].data]).toEqual([2, 6]);
  expect([...logits[1].data]).toEqual([8, 5]);
});
