import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentSystemPrompt,
  updateSystemPrompt,
  systemPromptHistory,
  loadPromptFromHistory,
  createSystemPrompt,
} from '~/lib/stores/studio';
import { MdSave, MdRefresh, MdHistory } from 'react-icons/md';

export function SystemPromptEditor() {
  const prompt = useStore(currentSystemPrompt);
  const history = useStore(systemPromptHistory);
  const [localContent, setLocalContent] = useState('');
  const [localName, setLocalName] = useState('');
  const [localTags, setLocalTags] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (prompt) {
      setLocalContent(prompt.content);
      setLocalName(prompt.name);
      setLocalTags(prompt.tags?.join(', ') || '');
    }
  }, [prompt]);

  const handleSave = () => {
    if (!localName.trim()) {
      return;
    }

    if (prompt) {
      updateSystemPrompt({
        name: localName,
        content: localContent,
        tags: localTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } else {
      createSystemPrompt(
        localName,
        localContent,
        localTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      );
    }

    setIsDirty(false);
  };

  const handleReset = () => {
    if (prompt) {
      setLocalContent(prompt.content);
      setLocalName(prompt.name);
      setLocalTags(prompt.tags?.join(', ') || '');
      setIsDirty(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    setIsDirty(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
    setIsDirty(true);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTags(e.target.value);
    setIsDirty(true);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={localName}
            onChange={handleNameChange}
            placeholder="System Prompt Name"
            className="w-full px-3 py-2 text-lg font-semibold border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            value={localTags}
            onChange={handleTagsChange}
            placeholder="Tags (comma-separated)"
            className="w-full px-3 py-1 mt-1 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={!isDirty}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            title="Revert changes"
          >
            <MdRefresh className="size-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <MdSave className="size-4" />
            Save
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Show history"
          >
            <MdHistory className="size-5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <textarea
          value={localContent}
          onChange={handleContentChange}
          placeholder="Enter your system prompt here. Use {{variable}} syntax for dynamic parameters..."
          className="flex-1 p-4 border border-gray-300 rounded-lg font-mono text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
        />
      </div>

      {/* Metadata and stats */}
      {prompt && (
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div>
            <span className="font-medium">Version:</span> {prompt.version}
          </div>
          <div>
            <span className="font-medium">Tokens:</span> ~{Math.ceil(localContent.length / 4)}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {new Date(prompt.updatedAt).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="border border-gray-300 rounded-lg dark:border-gray-600 max-h-48 overflow-y-auto">
          <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 px-3 py-2 font-medium text-sm">
            History ({history.length})
          </div>
          <div className="space-y-1">
            {history.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No history yet</div>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    loadPromptFromHistory(h.id);
                    setShowHistory(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                >
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(h.updatedAt).toLocaleString()} (v{h.version})
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
