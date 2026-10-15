// Text IDs and speech IDs use different vocabularies. Penalizing a text ID as
// if it were speech can suppress an unrelated sound and change the spoken words.
export function speechTokenPenalty(promptLength, penalty = 1.2) {
  return (sequences, logits) => {
    for (let batch = 0; batch < sequences.length; batch += 1) {
      const scores = logits[batch].data;
      for (const token of new Set(sequences[batch].slice(promptLength))) {
        const index = Number(token);
        if (index < 0 || index >= scores.length) continue;
        scores[index] = scores[index] < 0 ? scores[index] * penalty : scores[index] / penalty;
      }
    }
    return logits;
  };
}
