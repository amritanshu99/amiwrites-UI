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
    "How to practice mindfulness daily?",
    "Ways to boost self-esteem?",
  ],
  Anxiety: [
    "How to deal with anxiety?",
    "Grounding techniques for anxiety?",
    "Is anxiety normal and how to manage it?",
    "Breathing exercises to calm anxiety?",
    "How to recognize anxiety triggers?",
  ],
  Depression: [
    "What helps with feeling low?",
    "How to cope with depression?",
    "How to stay motivated during depression?",
    "How to reach out for help?",
    "Daily routines to combat depression?",
  ],
  "Sleep Issues": [
    "What are good sleep habits?",
    "How to improve sleep quality?",
    "Does screen time affect sleep?",
    "How to create a bedtime routine?",
    "Foods that help with better sleep?",
  ],
  Stress: [
    "How can I reduce daily stress?",
    "Stress-relief techniques?",
    "How to manage work-related stress?",
    "How to practice relaxation techniques?",
    "How to balance work and life?",
  ],
  Relationships: [
    "How to communicate better with a partner?",
    "Dealing with conflicts in relationships?",
    "Signs of a healthy relationship?",
    "How to build trust in relationships?",
    "Tips for maintaining friendships?",
  ],
  "Health and diet": [
    "What is a balanced diet?",
    "Tips for healthy eating?",
    "How does diet impact mental health?",
    "Foods that boost brain function?",
    "How to stay hydrated daily?",
  ],
  Career: [
    "How to find purpose in my career?",
    "Tips for managing work stress?",
    "How to grow professionally?",
    "How to set career goals?",
    "Networking tips for career growth?",
  ],
  "Daily motivation": [
    "How to stay motivated every day?",
    "Morning habits for a productive day?",
    "Simple mindset shifts for motivation?",
    "How to overcome procrastination?",
    "How to celebrate small wins?",
  ],
};


const AIChatHeader = ({ category, setCategory, onPromptClick }) => {
  const [promptsOpen, setPromptsOpen] = useState(false);
  const currentPrompts = CATEGORY_PROMPTS_MAP[category] || [];

  return (
    <>
      {/* Header Bar */}
      <div className="sticky top-[70px] z-40 flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-4 md:px-8 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 shadow-md border-b border-purple-700 dark:border-purple-900 rounded-b-xl">
        {/* Title */}
        <div className="flex items-center gap-2 text-white text-xl md:text-2xl font-bold">
          <Sparkles className="text-yellow-400 animate-pulse" size={26} />
          <span>AI Chat – Mental Wellness</span>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label
            htmlFor="category"
            className="text-white text-sm md:text-base font-medium"
          >
            Category:
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white dark:bg-zinc-800 bg-opacity-90 text-gray-900 dark:text-white px-4 py-2 rounded-full shadow-sm text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition w-full md:w-auto"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Tips Toolbar */}
      <div
        onClick={() => setPromptsOpen(!promptsOpen)}
        role="button"
        aria-expanded={promptsOpen}
        className="sticky top-[118px] z-30 flex justify-between items-center px-5 py-2 md:px-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md text-purple-900 dark:text-purple-200 font-medium text-sm md:text-base border-b border-purple-700 dark:border-purple-900 rounded-b-lg transition hover:bg-white/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none"
      >
        <span>Quick Tips</span>
        {promptsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {/* Prompt Suggestions */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden bg-white/20 dark:bg-zinc-900/30 backdrop-blur-lg border-b border-purple-700 dark:border-purple-900 rounded-b-xl px-4 md:px-6 ${
          promptsOpen ? "py-4 max-h-[500px]" : "py-0 max-h-0"
        }`}
      >
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 transition-opacity duration-300 ${
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
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm px-4 py-2 rounded-full shadow-md transition whitespace-nowrap"
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
