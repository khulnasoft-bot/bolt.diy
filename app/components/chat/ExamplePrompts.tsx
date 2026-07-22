import React from 'react';

const EXAMPLE_PROMPTS = [
  {
    icon: 'i-ph:app-window Duotone',
    text: 'Build a real-time dashboard with charts',
  },
  {
    icon: 'i-ph:shopping-cart Duotone',
    text: 'Create an e-commerce store with Stripe',
  },
  {
    icon: 'i-ph:chat-circle-dots Duotone',
    text: 'Build a chat app with live messaging',
  },
  {
    icon: 'i-ph:robot Duotone',
    text: 'Create an AI-powered content generator',
  },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-8 px-4">
      <p className="text-center text-sm text-bolt-elements-textTertiary">Describe an idea, or try one of these</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="group relative flex items-start gap-3 p-4 text-left rounded-xl
                border border-bolt-elements-borderColor
                bg-bolt-elements-bg-depth-1
                hover:border-accent-400 hover:shadow-md
                transition-all duration-200"
            >
              <div
                className={`shrink-0 mt-0.5 text-lg ${examplePrompt.icon} text-bolt-elements-textTertiary group-hover:text-accent-500 transition-colors`}
              />
              <span className="text-sm text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary transition-colors leading-relaxed">
                {examplePrompt.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
