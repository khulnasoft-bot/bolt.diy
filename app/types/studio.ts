/**
 * AI Studio Type Definitions
 * Core types for parameter controls, system prompts, sessions, and analytics
 */

/*
 * ============================================================================
 * Parameter Control Types
 * ============================================================================
 */

export type ParameterType = 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'slider' | 'textarea';

export interface ParameterConstraint {
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  minLength?: number;
  maxLength?: number;
}

export interface Parameter {
  id: string;
  name: string;
  description?: string;
  type: ParameterType;
  defaultValue: string | number | boolean | string[];
  value?: string | number | boolean | string[];
  required: boolean;
  constraints?: ParameterConstraint;
  order: number;
  visible: boolean;
  category?: string;
}

export interface ParameterGroup {
  name: string;
  description?: string;
  parameters: Parameter[];
  collapsed?: boolean;
}

/*
 * ============================================================================
 * System Prompt Types
 * ============================================================================
 */

export interface SystemPrompt {
  id: string;
  name: string;
  description?: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isActive: boolean;
  isTemplate?: boolean;
  templateId?: string;
  variables?: string[]; // Variables like {{variable}} in the prompt
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'general' | 'coding' | 'creative' | 'analysis' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  usageCount?: number;
  rating?: number;
  tags?: string[];
}

/*
 * ============================================================================
 * Session Types
 * ============================================================================
 */

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model?: string;
  metadata?: Record<string, any>;
}

export interface StudioSession {
  id: string;
  title: string;
  description?: string;
  systemPrompt: SystemPrompt;
  parameters: Parameter[];
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isArchived: boolean;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/*
 * ============================================================================
 * Analytics Types
 * ============================================================================
 */

export interface SessionAnalytics {
  sessionId: string;
  totalMessages: number;
  totalTokens: number;
  averageResponseTime: number; // milliseconds
  successRate: number; // 0-100
  errorCount: number;
  lastUsed: string;
  parameterUsage: Record<string, number>; // How often each parameter was modified
}

export interface StudioAnalytics {
  totalSessions: number;
  totalMessages: number;
  totalTokensUsed: number;
  averageSessionDuration: number;
  mostUsedPrompts: SystemPrompt[];
  mostUsedParameters: Parameter[];
  sessionsByModel: Record<string, number>;
  dailyUsage: Array<{ date: string; count: number }>;
  weeklyTrend: number[];
}

/*
 * ============================================================================
 * Versioning Types
 * ============================================================================
 */

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  changeLog?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SessionSnapshot {
  id: string;
  sessionId: string;
  timestamp: string;
  systemPrompt: SystemPrompt;
  parameters: Parameter[];
  messagesCount: number;
  metadata?: Record<string, any>;
}

/*
 * ============================================================================
 * Comparison Types
 * ============================================================================
 */

export interface ComparisonResult {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  comparisons: Array<{
    sessionId: string;
    title: string;
    systemPrompt: SystemPrompt;
    parameters: Parameter[];
    metrics: {
      responseTime: number;
      tokenCount: number;
      userSatisfaction?: number;
    };
  }>;
}

/*
 * ============================================================================
 * Playground Types
 * ============================================================================
 */

export interface PlaygroundConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  parameters: Parameter[];
}

export interface PlaygroundTest {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  actualOutput?: string;
  passed?: boolean;
  timestamp: string;
  config: PlaygroundConfig;
}

/*
 * ============================================================================
 * Rating Types
 * ============================================================================
 */

export interface Rating {
  id: string;
  targetId: string; // promptId, sessionId, etc.
  targetType: 'prompt' | 'session' | 'template';
  userId: string;
  score: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  targetId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>; // 1-5 star counts
}

/*
 * ============================================================================
 * Export Types
 * ============================================================================
 */

export interface ExportFormat {
  format: 'json' | 'markdown' | 'csv' | 'yaml';
  includeHistory: boolean;
  includeAnalytics: boolean;
}

export interface ExportData {
  sessions: StudioSession[];
  prompts: SystemPrompt[];
  templates: PromptTemplate[];
  analytics?: StudioAnalytics;
  exportedAt: string;
  version: string;
}
