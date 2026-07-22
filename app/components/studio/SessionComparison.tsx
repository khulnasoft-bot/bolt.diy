import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { sessionHistory } from '~/lib/stores/studio';
import type { StudioSession } from '~/types/studio';
import { MdCompare, MdClose } from 'react-icons/md';

export function SessionComparison() {
  const sessions = useStore(sessionHistory);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions((prev) => {
      if (prev.includes(sessionId)) {
        return prev.filter((id) => id !== sessionId);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, sessionId];
    });
  };

  const getSessionById = (id: string) => sessions.find((s) => s.id === id);

  const comparingSessions = selectedSessions.map(getSessionById).filter(Boolean) as StudioSession[];

  return (
    <div className="space-y-4">
      {/* Session Selector */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MdCompare className="size-5" />
          Select Sessions (up to 3)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No sessions yet</p>
          ) : (
            sessions.map((session) => (
              <label
                key={session.id}
                className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSessions.includes(session.id)}
                  onChange={() => handleSelectSession(session.id)}
                  disabled={selectedSessions.length >= 3 && !selectedSessions.includes(session.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{session.messages.length} messages</p>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={() => setComparing(true)}
          disabled={comparingSessions.length < 2}
          className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Compare {comparingSessions.length} Sessions
        </button>
      </div>

      {/* Comparison View */}
      {comparing && comparingSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Comparison</h3>
            <button
              onClick={() => setComparing(false)}
              className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MdClose className="size-5" />
            </button>
          </div>

          {/* Metrics Comparison */}
          <div className="grid gap-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Metric</th>
                    {comparingSessions.map((session) => (
                      <th key={session.id} className="border border-gray-300 dark:border-gray-600 p-2 text-left">
                        {session.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Messages</td>
                    {comparingSessions.map((session) => (
                      <td key={session.id} className="border border-gray-300 dark:border-gray-600 p-2">
                        {session.messages.length}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Model</td>
                    {comparingSessions.map((session) => (
                      <td key={session.id} className="border border-gray-300 dark:border-gray-600 p-2">
                        {session.model}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Temperature</td>
                    {comparingSessions.map((session) => (
                      <td key={session.id} className="border border-gray-300 dark:border-gray-600 p-2">
                        {(session.temperature || 0.7).toFixed(1)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Max Tokens</td>
                    {comparingSessions.map((session) => (
                      <td key={session.id} className="border border-gray-300 dark:border-gray-600 p-2">
                        {session.maxTokens || 2000}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Created</td>
                    {comparingSessions.map((session) => (
                      <td key={session.id} className="border border-gray-300 dark:border-gray-600 p-2 text-xs">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* System Prompts */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">System Prompts</h4>
              <div className="grid gap-2">
                {comparingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
                  >
                    <p className="font-medium text-sm mb-1">{session.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                      {session.systemPrompt.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters Comparison */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Parameters Used</h4>
              <div className="grid gap-2">
                {comparingSessions.map((session) => (
                  <div key={session.id} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="font-medium text-sm mb-2">{session.title}</p>
                    {session.parameters.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No parameters</p>
                    ) : (
                      <ul className="space-y-1">
                        {session.parameters.map((param) => (
                          <li key={param.id} className="text-xs">
                            <span className="font-medium">{param.name}:</span> {param.value || param.defaultValue}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
