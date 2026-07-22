import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { playgroundConfig, updatePlaygroundConfig, currentSystemPrompt } from '~/lib/stores/studio';
import { MdPlayArrow, MdRefresh } from 'react-icons/md';
import type { AIMessage } from '~/types/studio';

export function Playground() {
  const config = useStore(playgroundConfig);
  const systemPrompt = useStore(currentSystemPrompt);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to LLM
      const response = await fetch('/api/studio/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          config,
          systemPrompt: systemPrompt?.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = (await response.json()) as any;
      const assistantMessage: AIMessage = {
        id: `msg_${Date.now()}_response`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        tokens: data.tokens,
        model: config.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Configuration Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <label className="block text-xs font-medium mb-1">Temperature</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) => updatePlaygroundConfig({ temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{config.temperature.toFixed(1)}</span>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Max Tokens</label>
          <input
            type="number"
            value={config.maxTokens}
            onChange={(e) => updatePlaygroundConfig({ maxTokens: parseInt(e.target.value) })}
            className="w-full px-2 py-1 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Top P</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.topP}
            onChange={(e) => updatePlaygroundConfig({ topP: parseFloat(e.target.value) })}
            className="w-full"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{config.topP.toFixed(1)}</span>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Model</label>
          <select
            value={config.model}
            onChange={(e) => updatePlaygroundConfig({ model: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-2">Start by typing a message below</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-sm px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                {msg.tokens && <p className="text-xs opacity-70 mt-1">{msg.tokens.total} tokens</p>}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">{error}</div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type your message... (Shift+Enter for new line)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
          rows={3}
          disabled={isLoading}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <MdPlayArrow className="size-4" />
          </button>
          <button
            onClick={handleClearMessages}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            <MdRefresh className="size-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {messages.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <div>
            <span className="font-medium">Messages:</span> {messages.length}
          </div>
          <div>
            <span className="font-medium">Total Tokens:</span>{' '}
            {messages.reduce((sum, m) => sum + (m.tokens?.total || 0), 0)}
          </div>
          <div>
            <span className="font-medium">Model:</span> {config.model}
          </div>
        </div>
      )}
    </div>
  );
}
