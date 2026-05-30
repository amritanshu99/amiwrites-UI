import React, { useState } from "react";
import {
  Activity,
  Brain,
  Briefcase,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Leaf,
  Moon,
  Sparkles,
  Sunrise,
  Users,
  Zap,
} from "lucide-react";

const CATEGORIES = [
  {
    value: "Mental Well-being",
    label: "Mental well-being",
    description: "Balanced support",
    icon: Brain,
  },
  {
    value: "Anxiety",
    label: "Anxiety",
    description: "Grounding and calm",
    icon: Activity,
  },
  {
    value: "Depression",
    label: "Depression",
    description: "Gentle next steps",
    icon: HeartPulse,
  },
  {
    value: "Sleep Issues",
    label: "Sleep issues",
    description: "Rest routines",
    icon: Moon,
  },
  {
    value: "Stress",
    label: "Stress",
    description: "Pressure relief",
    icon: Zap,
  },
  {
    value: "Relationships",
    label: "Relationships",
    description: "Clearer connection",
    icon: Users,
  },
  {
    value: "Health and diet",
    label: "Health and diet",
    description: "Daily habits",
    icon: Leaf,
  },
  {
    value: "Career",
    label: "Career",
    description: "Work and goals",
    icon: Briefcase,
  },
  {
    value: "Daily motivation",
    label: "Daily motivation",
    description: "Momentum",
    icon: Sunrise,
  },
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
  const selectedCategory =
    CATEGORIES.find((item) => item.value === category) || CATEGORIES[0];
  const SelectedIcon = selectedCategory.icon;

  return (
    <aside className="relative min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white/[0.88] p-4 shadow-[0_22px_56px_-38px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.95)] sm:p-5 lg:sticky lg:top-24">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0891b2,#10b981,#f59e0b)]" />

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-200 shadow-sm dark:bg-cyan-300 dark:text-slate-950">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-200">
            Ami AI Chat
          </p>
          <h1 className="mt-1 text-xl font-bold leading-7 text-slate-950 dark:text-white sm:text-2xl">
            Mental wellness desk
          </h1>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-zinc-300">
            Pick a focus area and start with a prompt, or ask your own question.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="ai-chat-category"
          className="mb-2 block text-sm font-semibold text-slate-800 dark:text-zinc-100"
        >
          Focus area
        </label>
        <div className="relative">
          <SelectedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-zinc-400" />
          <select
            id="ai-chat-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-9 pr-10 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-colors focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-zinc-400" />
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-1 lg:overflow-visible lg:pb-0">
        {CATEGORIES.map((item) => {
          const Icon = item.icon;
          const isSelected = item.value === category;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`flex min-h-[3.25rem] min-w-[10.25rem] items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:focus-visible:ring-cyan-300/10 lg:min-w-0 ${
                isSelected
                  ? "border-cyan-300 bg-cyan-50 text-slate-950 shadow-sm dark:border-cyan-300/40 dark:bg-cyan-300/[0.12] dark:text-white"
                  : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-white/[0.18] dark:hover:bg-white/[0.07]"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? "bg-cyan-600 text-white dark:bg-cyan-300 dark:text-slate-950"
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-5">
                  {item.label}
                </span>
                <span className="block text-xs leading-4 text-slate-500 dark:text-zinc-400">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setPromptsOpen((open) => !open)}
        aria-expanded={promptsOpen}
        className="mt-4 flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white/[0.78] px-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-100 dark:hover:bg-white/[0.08] dark:focus-visible:ring-cyan-300/10 lg:hidden"
      >
        Prompt starters
        {promptsOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 lg:mt-5 lg:max-h-none lg:overflow-visible lg:opacity-100 ${
          promptsOpen ? "mt-3 max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="hidden text-sm font-semibold text-slate-800 dark:text-zinc-100 lg:block">
          Prompt starters
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:mt-3 lg:grid-cols-1">
          {currentPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                onPromptClick(prompt);
                setPromptsOpen(false);
              }}
              className="min-h-11 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-left text-sm font-medium leading-5 text-emerald-950 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:border-emerald-300/[0.15] dark:bg-emerald-300/10 dark:text-emerald-50 dark:hover:bg-emerald-300/[0.15] dark:focus-visible:ring-emerald-300/10"
            >
              <span className="break-words">{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default AIChatHeader;
