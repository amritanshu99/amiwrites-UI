import { spokenTechnicalTerms } from "./pocketVoiceText";

test("speaks technical acronyms and Node.js as letters, preserving surrounding prose", () => {
  expect(spokenTechnicalTerms("I use React, Node.js, MERN, AI/ML, NLP, and an API for UI tools."))
    .toBe("I use React, Node J S, M E R N, A I and M L, N L P, and an A P I for U I tools.");
  expect(spokenTechnicalTerms("Mail, retail and modern databases stay useful."))
    .toBe("Mail, retail and modern databases stay useful.");
});
