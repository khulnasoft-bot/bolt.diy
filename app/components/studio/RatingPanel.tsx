import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentSession, currentSystemPrompt } from '~/lib/stores/studio';
import type { Rating, RatingStats } from '~/types/studio';
import { MdStar } from 'react-icons/md';

export function RatingPanel() {
  const session = useStore(currentSession);
  const prompt = useStore(currentSystemPrompt);

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [sessionRating, setSessionRating] = useState(0);
  const [promptRating, setPromptRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRateSession = async () => {
    if (!session || sessionRating === 0) {
      return;
    }

    const rating: Rating = {
      id: `rating_${Date.now()}`,
      targetId: session.id,
      targetType: 'session',
      userId: 'current-user',
      score: sessionRating,
      comment: comment || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRatings((prev) => [...prev, rating]);
    setSessionRating(0);
    setComment('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleRatePrompt = async () => {
    if (!prompt || promptRating === 0) {
      return;
    }

    const rating: Rating = {
      id: `rating_${Date.now()}`,
      targetId: prompt.id,
      targetType: 'prompt',
      userId: 'current-user',
      score: promptRating,
      comment: comment || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRatings((prev) => [...prev, rating]);
    setPromptRating(0);
    setComment('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const computeRatingStats = (targetId: string, targetType: string): RatingStats => {
    const targetRatings = ratings.filter((r) => r.targetId === targetId && r.targetType === targetType);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    targetRatings.forEach((r) => {
      distribution[r.score] = (distribution[r.score] || 0) + 1;
    });

    const averageRating =
      targetRatings.length > 0 ? targetRatings.reduce((sum, r) => sum + r.score, 0) / targetRatings.length : 0;

    return {
      targetId,
      averageRating,
      totalRatings: targetRatings.length,
      ratingDistribution: distribution,
    };
  };

  const renderStars = (rating: number, onSelect: (value: number) => void) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onSelect(star)}
            className={`text-2xl transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            <MdStar className="size-6" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm">
          Rating submitted successfully!
        </div>
      )}

      {/* Rate Session */}
      {session && (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h3 className="font-semibold mb-2">Rate This Session</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{session.title}</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(sessionRating, setSessionRating)}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this session..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleRateSession}
              disabled={sessionRating === 0}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Submit Rating
            </button>
          </div>

          {/* Rating Stats */}
          {(() => {
            const stats = computeRatingStats(session.id, 'session');
            return stats.totalRatings > 0 ? (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-sm font-medium mb-2">
                  Average: {stats.averageRating.toFixed(1)} ⭐ ({stats.totalRatings} rating
                  {stats.totalRatings !== 1 ? 's' : ''})
                </p>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-6">{star}★</span>
                      <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-yellow-400 h-1 rounded-full"
                          style={{
                            width: `${stats.totalRatings > 0 ? (stats.ratingDistribution[star] / stats.totalRatings) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right">{stats.ratingDistribution[star] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Rate Prompt */}
      {prompt && (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h3 className="font-semibold mb-2">Rate This Prompt</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{prompt.name}</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(promptRating, setPromptRating)}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this prompt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleRatePrompt}
              disabled={promptRating === 0}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Submit Rating
            </button>
          </div>

          {/* Rating Stats */}
          {(() => {
            const stats = computeRatingStats(prompt.id, 'prompt');
            return stats.totalRatings > 0 ? (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-sm font-medium mb-2">
                  Average: {stats.averageRating.toFixed(1)} ⭐ ({stats.totalRatings} rating
                  {stats.totalRatings !== 1 ? 's' : ''})
                </p>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-6">{star}★</span>
                      <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-yellow-400 h-1 rounded-full"
                          style={{
                            width: `${stats.totalRatings > 0 ? (stats.ratingDistribution[star] / stats.totalRatings) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right">{stats.ratingDistribution[star] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* No Content State */}
      {!session && !prompt && (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">Load a session or prompt to rate it</p>
        </div>
      )}
    </div>
  );
}
