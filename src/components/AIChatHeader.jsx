import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = [
  "Mental Well-being",
  "Anxiety",
  "Depression",
  "Sleep Issues",
  "Stress",
  "Relationships",
  "Health and diet",
  "Career",
  "Daily motivation",
];

const CATEGORY_PROMPTS_MAP = {
  "Mental Well-being": [
    "Tips for better mental health?",
    "How to build emotional resilience?",
    "What are daily mental wellness habits?",
  ],
  Anxiety: [
    "How to deal with anxiety?",
    "Grounding techniques for anxiety?",
    "Is anxiety normal and how to manage it?",
  ],
  Depression: [
    "What helps with feeling low?",
    "How to cope with depression?",
    "How to stay motivated during depression?",
  ],
  "Sleep Issues": [
    "What are good sleep habits?",
    "How to improve sleep quality?",
    "Does screen time affect sleep?",
  ],
  Stress: [
    "How can I reduce daily stress?",
    "Stress-relief techniques?",
    "How to manage work-related stress?",
  ],
  Relationships: [
    "How to communicate better with a partner?",
    "Dealing with conflicts in relationships?",
    "Signs of a healthy relationship?",
  ],
  "Health and diet": [
    "What is a balanced diet?",
    "Tips for healthy eating?",
    "How does diet impact mental health?",
  ],
  Career: [
    "How to find purpose in my career?",
    "Tips for managing work stress?",
    "How to grow professionally?",
  ],
  "Daily motivation": [
    "How to stay motivated every day?",
    "Morning habits for a productive day?",
    "Simple mindset shifts for motivation?",
  ],
};

const AIChatHeader = ({ category, setCategory, onPromptClick }) => {
  const [promptsOpen, setPromptsOpen] = useState(false);
  const currentPrompts = CATEGORY_PROMPTS_MAP[category] || [];

  return (
    <>
      {/* Chat header bar */}
      <div
        className="
          sticky top-[70px] z-40
          flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6
          px-4 py-3 md:px-6
          bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800
          dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900
          shadow-md border-b-2 border-purple-700 dark:border-purple-900
          rounded-b-xl
        "
      >
        {/* Title */}
        <div className="flex items-center gap-2 text-white text-lg md:text-2xl font-semibold select-none">
          <Sparkles className="text-yellow-400 animate-pulse" size={24} />
          <span>AI Chat – Mental Wellness</span>
        </div>

        {/* Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label
            htmlFor="category"
            className="text-white font-medium text-sm md:text-base"
          >
            Category:
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="
              w-full md:w-auto
              bg-white dark:bg-zinc-800 bg-opacity-90 dark:bg-opacity-90
              text-gray-900 dark:text-white
              px-3 py-2 rounded-full shadow-sm
              border border-transparent
              text-sm md:text-base
              font-medium
              focus:outline-none focus:ring-2 focus:ring-purple-400
              transition
              cursor-pointer
            "
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggle tips button */}
      <div
        onClick={() => setPromptsOpen(!promptsOpen)}
        className="
          sticky top-[118px] z-30
          flex justify-between items-center
          px-4 py-2
          bg-white/20 dark:bg-zinc-900/30
          backdrop-blur-md
          text-purple-900 dark:text-purple-300
          font-medium text-sm md:text-base
          border-b border-purple-700 dark:border-purple-900
          rounded-b-lg
          transition hover:bg-white/30 dark:hover:bg-zinc-900/50
          cursor-pointer select-none
        "
        role="button"
        aria-expanded={promptsOpen}
      >
        <span>Quick Tips</span>
        {promptsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {/* Collapsible tips section */}
      <div
        className={`
          overflow-hidden
          transition-all duration-300 ease-in-out
          bg-white/10 dark:bg-zinc-900/20
          backdrop-blur-sm
          border-b border-purple-700 dark:border-purple-900
          px-5
          ${promptsOpen ? "py-4 max-h-[300px]" : "py-0 max-h-0"}
          rounded-b-xl
        `}
      >
        <div
          className={`flex flex-wrap gap-2 md:gap-3 justify-center transition-opacity duration-300 ${
            promptsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {currentPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                onPromptClick(prompt);
                setPromptsOpen(false);
              }}
              className="
                bg-purple-600 hover:bg-purple-700 active:bg-purple-800
                text-white text-sm md:text-base
                px-4 py-1.5 rounded-full shadow-md
                transition
                whitespace-nowrap
              "
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default AIChatHeader;
