# AmiBot evaluation workspace

Visit **AmiBot Admin → RAG evaluations**, or `/amibot-admin/evals`. The existing verified-admin route protects the lazy-loaded workspace. Deploy the matching backend eval endpoints first.

- **Test suite:** create/edit questions, expected behavior, short fact phrases, supporting passages, reference answers, and follow-up history.
- **Results:** run the current suite, pause/resume pending cases, filter by outcome, and inspect reference versus actual answers and the exact context sent to the model.
- **How to read this:** plain-language metric definitions, denominator rules, and limitations.
- **Run selector / JSON download:** revisit the latest 20 saved runs and export a complete evidence snapshot. Deltas compare only matching test definitions and evaluator versions.

The page supports light/dark themes, narrow layouts, keyboard focus, a native modal editor, reduced motion, visible errors, and zero-data states. It does not include prefilled production scores. Live evals use the real backend and can incur model costs; they never create user chat messages or admin emails.

Run UI behavior checks with:

```sh
npm test -- --watch=false --runInBand src/components/AmiBot/AmiBotEvals.test.jsx
```

The backend’s `docs/AMIBOT_EVALS.md` describes scoring, reproducibility, API contracts, and the offline retrieval regression suite. Phrase checks are intentionally labeled as such; passing them does not prove semantic correctness or faithfulness.
