import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = [
  "Mental Well-being",
  "Anxiety",
  "Depression",
  "Sleep Issues",
  "Stress",
];

const PREDEFINED_PROMPTS = [
  "How can I reduce daily stress?",
  "What are good sleep habits?",
  "How to deal with anxiety?",
  "Tips for better mental health?",
];

const AIChatHeader = ({ category, setCategory, onPromptClick }) => {
  const [promptsOpen, setPromptsOpen] = useState(false);
  const mainHeaderHeight = 70;

  return (
    <>
      {/* Sticky AI Chat Header below main header */}
      <div
        className="
          w-full
          bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800
          dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900
          shadow-lg
          sticky
          z-40
          px-5 py-3
          flex flex-col md:flex-row md:items-center md:justify-between
          gap-3 md:gap-6
          rounded-b-lg
          border-b-2 border-purple-700 dark:border-purple-900
        "
        style={{
          top: mainHeaderHeight,
          position: "sticky",
          backgroundClip: "padding-box",
        }}
      >
        {/* Title and Icon */}
        <div className="flex items-center gap-2 text-white text-xl md:text-2xl font-bold select-none justify-center md:justify-start">
          <Sparkles className="text-yellow-400 animate-pulse" size={24} />
          AI Chat - Mental Wellness
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 justify-center md:justify-end w-full md:w-auto">
          <label
            htmlFor="category-select"
            className="text-white font-semibold whitespace-nowrap select-none text-sm md:text-base"
          >
            Category:
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="
              px-3 py-1.5
              rounded-full
              bg-white bg-opacity-90 dark:bg-zinc-800 dark:bg-opacity-90
              border border-transparent
              text-gray-900 dark:text-white
              text-sm md:text-base
              font-medium
              shadow-sm
              focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-600
              transition
              cursor-pointer
              w-full max-w-xs md:max-w-none
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

      {/* Always visible, slim Quick Tips header with toggle */}
      <div
        className="
          w-full
          bg-white/20 dark:bg-zinc-900/30
          backdrop-blur-sm
          border-b border-purple-700 dark:border-purple-900
          px-5 py-2
          flex justify-between items-center select-none
          cursor-pointer
          text-purple-900 dark:text-purple-300
          font-semibold text-sm md:text-base
          shadow-sm
          sticky
          top-[calc(70px+48px)] /* Stick below main header and this bar */
          z-30
          rounded-b-lg
          transition-colors duration-300
          hover:bg-white/30 dark:hover:bg-zinc-900/50
        "
        onClick={() => setPromptsOpen(!promptsOpen)}
        role="button"
        aria-expanded={promptsOpen}
        aria-label={promptsOpen ? "Collapse tips" : "Expand tips"}
      >
        Quick Tips
        {promptsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {/* Collapsible Quick Tips content */}
      <div
        className={`
          bg-white/10 dark:bg-zinc-900/20
          backdrop-blur-sm
          border-b border-purple-700 dark:border-purple-900
          rounded-b-lg
          px-5
          overflow-hidden
          transition-[max-height,padding] duration-300 ease-in-out
          ${promptsOpen ? "py-3" : "py-0"}
        `}
        style={{ maxHeight: promptsOpen ? "300px" : "0" }}
      >
        <div
          className={`flex flex-wrap justify-center gap-2 md:gap-3 ${
            promptsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300`}
        >
          {PREDEFINED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                onPromptClick(prompt);
                setPromptsOpen(false); // Collapse quick tips on selection
              }}
              className="
                bg-purple-600
                text-white
                text-sm md:text-base
                px-3 md:px-4 py-1.5 rounded-full
                shadow-md
                hover:bg-purple-700
                active:bg-purple-800
                transition
                select-none
                cursor-pointer
                whitespace-nowrap
                flex-shrink-0
              "
              type="button"
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
