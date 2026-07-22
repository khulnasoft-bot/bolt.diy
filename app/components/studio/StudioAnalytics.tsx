import { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { sessionHistory, sessionAnalytics } from '~/lib/stores/studio';
import type { StudioAnalytics as IStudioAnalytics } from '~/types/studio';
import { MdTrendingUp, MdBarChart, MdTimer, MdCheckCircle } from 'react-icons/md';

export function StudioAnalytics() {
  const sessions = useStore(sessionHistory);
  const analytics = useStore(sessionAnalytics);

  const computedAnalytics = useMemo(() => {
    const stats: IStudioAnalytics = {
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0),
      totalTokensUsed: Object.values(analytics).reduce((sum, a) => sum + (a?.totalTokens || 0), 0),
      averageSessionDuration: 0,
      mostUsedPrompts: [],
      mostUsedParameters: [],
      sessionsByModel: {},
      dailyUsage: [],
      weeklyTrend: [],
    };

    // Calculate average session duration
    if (sessions.length > 0) {
      const durations = sessions.map((s) => {
        const start = new Date(s.createdAt).getTime();
        const end = new Date(s.updatedAt).getTime();

        return end - start;
      });
      stats.averageSessionDuration = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
    }

    // Count sessions by model
    sessions.forEach((session) => {
      stats.sessionsByModel[session.model] = (stats.sessionsByModel[session.model] || 0) + 1;
    });

    // Weekly trend (mock data)
    stats.weeklyTrend = Array(7)
      .fill(0)
      .map((_, i) => Math.floor(Math.random() * 10) + (i > 3 ? 5 : 0));

    return stats;
  }, [sessions, analytics]);

  const successRate = useMemo(() => {
    const totalAnalytics = Object.values(analytics);

    if (totalAnalytics.length === 0) {
      return 0;
    }

    const avgSuccess = totalAnalytics.reduce((sum, a) => sum + (a?.successRate || 0), 0);

    return Math.round(avgSuccess / totalAnalytics.length);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{computedAnalytics.totalSessions}</p>
            </div>
            <MdBarChart className="size-8 text-blue-400" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Messages</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{computedAnalytics.totalMessages}</p>
            </div>
            <MdTrendingUp className="size-8 text-green-400" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Tokens</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {computedAnalytics.totalTokensUsed.toLocaleString()}
              </p>
            </div>
            <MdBarChart className="size-8 text-purple-400" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{successRate}%</p>
            </div>
            <MdCheckCircle className="size-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Models Distribution */}
      {Object.keys(computedAnalytics.sessionsByModel).length > 0 && (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h3 className="font-semibold mb-4">Sessions by Model</h3>
          <div className="space-y-3">
            {Object.entries(computedAnalytics.sessionsByModel).map(([model, count]) => {
              const percentage = (count / computedAnalytics.totalSessions) * 100;
              return (
                <div key={model}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{model}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{count} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Trend */}
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
        <h3 className="font-semibold mb-4">Weekly Usage Trend</h3>
        <div className="flex items-end gap-2 h-32">
          {computedAnalytics.weeklyTrend.map((value, idx) => {
            const maxValue = Math.max(...computedAnalytics.weeklyTrend);
            const height = (value / maxValue) * 100;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                  style={{ height: `${height}%` || '5%', minHeight: '5%' }}
                  title={`${value} sessions`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{days[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MdTimer className="size-5 text-blue-500" />
            <h4 className="font-medium">Avg Session Duration</h4>
          </div>
          <p className="text-2xl font-bold">
            {Math.floor(computedAnalytics.averageSessionDuration / 1000)}
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">seconds</span>
          </p>
        </div>

        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h4 className="font-medium mb-2">Avg Messages per Session</h4>
          <p className="text-2xl font-bold">
            {computedAnalytics.totalSessions > 0
              ? (computedAnalytics.totalMessages / computedAnalytics.totalSessions).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {computedAnalytics.totalSessions === 0 && (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No analytics data yet. Create and run some sessions to see usage patterns.
          </p>
        </div>
      )}
    </div>
  );
}
