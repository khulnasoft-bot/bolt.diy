import { atom, map } from 'nanostores';
import { createScopedLogger } from '~/utils/logger';
import type {
  Parameter,
  ParameterGroup,
  SystemPrompt,
  StudioSession,
  PromptTemplate,
  PlaygroundConfig,
  SessionAnalytics,
} from '~/types/studio';

const logger = createScopedLogger('StudioStore');

/*
 * ============================================================================
 * Parameter Management
 * ============================================================================
 */

export const currentParameters = atom<Parameter[]>([]);
export const parameterGroups = atom<ParameterGroup[]>([]);
export const selectedParameterCategory = atom<string | null>(null);

export const setParameters = (params: Parameter[]) => {
  logger.debug('Setting parameters', params);
  currentParameters.set(params);
};

export const updateParameter = (paramId: string, updates: Partial<Parameter>) => {
  const current = currentParameters.get();
  const updated = current.map((p) => (p.id === paramId ? { ...p, ...updates } : p));
  currentParameters.set(updated);
  logger.debug(`Updated parameter: ${paramId}`, updates);
};

export const addParameter = (param: Parameter) => {
  const current = currentParameters.get();
  currentParameters.set([...current, param]);
  logger.debug('Added parameter', param);
};

export const removeParameter = (paramId: string) => {
  const current = currentParameters.get();
  currentParameters.set(current.filter((p) => p.id !== paramId));
  logger.debug(`Removed parameter: ${paramId}`);
};

export const resetParameters = () => {
  currentParameters.set([]);
  logger.debug('Parameters reset');
};

/*
 * ============================================================================
 * System Prompt Management
 * ============================================================================
 */

export const currentSystemPrompt = atom<SystemPrompt | null>(null);
export const systemPromptTemplates = atom<PromptTemplate[]>([]);
export const systemPromptHistory = atom<SystemPrompt[]>([]);
export const isEditingPrompt = atom<boolean>(false);

export const setSystemPrompt = (prompt: SystemPrompt) => {
  currentSystemPrompt.set(prompt);
  logger.debug('System prompt set', prompt.id);

  // Add to history
  const history = systemPromptHistory.get();
  const updated = [prompt, ...history].slice(0, 50); // Keep last 50
  systemPromptHistory.set(updated);
};

export const updateSystemPrompt = (updates: Partial<SystemPrompt>) => {
  const current = currentSystemPrompt.get();

  if (current) {
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setSystemPrompt(updated);
  }
};

export const createSystemPrompt = (name: string, content: string, tags?: string[]): SystemPrompt => {
  const now = new Date().toISOString();
  const prompt: SystemPrompt = {
    id: `prompt_${Date.now()}`,
    name,
    content,
    version: 1,
    createdAt: now,
    updatedAt: now,
    tags,
    isActive: true,
  };

  setSystemPrompt(prompt);

  return prompt;
};

export const savePromptToHistory = () => {
  const current = currentSystemPrompt.get();

  if (current) {
    const history = systemPromptHistory.get();
    systemPromptHistory.set([current, ...history].slice(0, 50));
    logger.debug('Prompt saved to history', current.id);
  }
};

export const loadPromptFromHistory = (promptId: string) => {
  const history = systemPromptHistory.get();
  const prompt = history.find((p) => p.id === promptId);

  if (prompt) {
    setSystemPrompt(prompt);
    logger.debug('Loaded prompt from history', promptId);
  }
};

export const loadSystemPromptTemplates = (templates: PromptTemplate[]) => {
  systemPromptTemplates.set(templates);
  logger.debug('Loaded system prompt templates', templates.length);
};

export const usePromptTemplate = (template: PromptTemplate) => {
  const prompt = createSystemPrompt(`${template.name} (custom)`, template.content, template.tags);
  prompt.templateId = template.id;
  setSystemPrompt(prompt);
  logger.debug('Used prompt template', template.id);
};

/*
 * ============================================================================
 * Session Management
 * ============================================================================
 */

export const currentSession = atom<StudioSession | null>(null);
export const sessionHistory = atom<StudioSession[]>([]);
export const isLoadingSession = atom<boolean>(false);

export const setCurrentSession = (session: StudioSession) => {
  currentSession.set(session);
  logger.debug('Current session set', session.id);
};

export const createNewSession = (
  title: string,
  systemPrompt: SystemPrompt,
  parameters: Parameter[],
  model: string = 'gpt-4',
): StudioSession => {
  const now = new Date().toISOString();
  const session: StudioSession = {
    id: `session_${Date.now()}`,
    title,
    systemPrompt,
    parameters,
    messages: [],
    createdAt: now,
    updatedAt: now,
    isArchived: false,
    model,
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  };

  setCurrentSession(session);
  saveSessionToHistory(session);

  return session;
};

export const saveSessionToHistory = (session: StudioSession) => {
  const history = sessionHistory.get();
  const updated = history.filter((s) => s.id !== session.id);
  sessionHistory.set([session, ...updated].slice(0, 100)); // Keep last 100
  logger.debug('Session saved to history', session.id);
};

export const loadSessionFromHistory = (sessionId: string) => {
  const history = sessionHistory.get();
  const session = history.find((s) => s.id === sessionId);

  if (session) {
    setCurrentSession(session);
    logger.debug('Loaded session from history', sessionId);
  }
};

/*
 * ============================================================================
 * Playground Configuration
 * ============================================================================
 */

export const playgroundConfig = atom<PlaygroundConfig>({
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: '',
  parameters: [],
});

export const updatePlaygroundConfig = (updates: Partial<PlaygroundConfig>) => {
  const current = playgroundConfig.get();
  playgroundConfig.set({ ...current, ...updates });
  logger.debug('Playground config updated', updates);
};

/*
 * ============================================================================
 * Analytics
 * ============================================================================
 */

export const sessionAnalytics = map<Record<string, SessionAnalytics>>({});

export const recordSessionAnalytics = (sessionId: string, analytics: SessionAnalytics) => {
  const current = sessionAnalytics.get();
  sessionAnalytics.set({ ...current, [sessionId]: analytics });
  logger.debug('Session analytics recorded', sessionId);
};

export const getSessionAnalytics = (sessionId: string) => {
  return sessionAnalytics.get()[sessionId];
};

/*
 * ============================================================================
 * Persistence
 * ============================================================================
 */

export const persistStudioState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const state = {
    currentPrompt: currentSystemPrompt.get(),
    promptHistory: systemPromptHistory.get(),
    currentSession: currentSession.get(),
    sessionHistory: sessionHistory.get(),
    playgroundConfig: playgroundConfig.get(),
  };

  try {
    localStorage.setItem('studio_state', JSON.stringify(state));
    logger.debug('Studio state persisted');
  } catch (error) {
    logger.error('Failed to persist studio state', error);
  }
};

export const loadStudioState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = localStorage.getItem('studio_state');

    if (stored) {
      const state = JSON.parse(stored);

      if (state.currentPrompt) {
        currentSystemPrompt.set(state.currentPrompt);
      }

      if (state.promptHistory) {
        systemPromptHistory.set(state.promptHistory);
      }

      if (state.currentSession) {
        currentSession.set(state.currentSession);
      }

      if (state.sessionHistory) {
        sessionHistory.set(state.sessionHistory);
      }

      if (state.playgroundConfig) {
        playgroundConfig.set(state.playgroundConfig);
      }

      logger.debug('Studio state loaded from persistence');
    }
  } catch (error) {
    logger.error('Failed to load studio state', error);
  }
};

// Auto-persist on changes
if (typeof window !== 'undefined') {
  currentSystemPrompt.subscribe(() => persistStudioState());
  currentSession.subscribe(() => persistStudioState());
  playgroundConfig.subscribe(() => persistStudioState());
}
