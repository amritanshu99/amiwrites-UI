// Spoken forms only; the answer shown in chat is never rewritten.
export function spokenTechnicalTerms(text) {
  return text
    .replace(/\bNode\.js\b/gi, "Node J S")
    .replace(/\bAI\/ML\b/g, "A I and M L")
    .replace(/\b(?:AI|ML|API|UI|UX|MERN|NLP)\b/g, word => word.split("").join(" "));
}
