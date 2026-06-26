/**
 * Discovery Engine REST API Client
 *
 * Typed client for Google Cloud Discovery Engine (Gemini Enterprise) APIs.
 * All methods require a valid OAuth2 access token with cloud-platform scope.
 *
 * Configured via environment variables:
 *   VITE_GCP_PROJECT_NUMBER, VITE_GE_ENGINE_ID
 * Location: global
 * Assistant: default_assistant
 */

const PROJECT_NUMBER = import.meta.env.VITE_GCP_PROJECT_NUMBER || '';
const LOCATION = 'global';
const ENGINE_ID = import.meta.env.VITE_GE_ENGINE_ID || '';
const ASSISTANT_ID = 'default_assistant';

const RESOURCE_PATH = `projects/${PROJECT_NUMBER}/locations/${LOCATION}/collections/default_collection/engines/${ENGINE_ID}`;
const BASE_URL = `https://discoveryengine.googleapis.com/v1alpha/${RESOURCE_PATH}`;
const ASSISTANT_PATH = `${BASE_URL}/assistants/${ASSISTANT_ID}`;

// ─── Types ───────────────────────────────────────────────────────

export interface DiscoveryEngineAgent {
  name: string;
  displayName?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  state?: string;
  sharingConfig?: {
    scope?: string;
  };
  managedAgentDefinition?: Record<string, unknown>;
  lowCodeAgentDefinition?: {
    nodes?: LowCodeAgentNode[];
    rootAgentId?: string;
    deployedNodes?: LowCodeAgentNode[];
    deployedRootAgentId?: string;
    draftDisplayName?: string;
    draftDescription?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AgentView {
  name: string;
  displayName?: string;
  description?: string;
  icon?: { content?: string };
  agentOrigin?: 'USER' | 'GOOGLE' | string;
  state?: 'ENABLED' | 'PRIVATE' | string;
  userPermissions?: {
    canRun?: boolean;
    canView?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canWithdraw?: boolean;
    canRequestReview?: boolean;
    canProposeUsers?: boolean;
  };
  agentType?: 'LOW_CODE' | 'MANAGED' | string;
  suggestedPrompts?: { text: string }[];
  agentSharingState?: 'SHARED' | 'NOT_SHARED' | string;
  lowCodeAgentInfo?: { hasDeployedVersion?: boolean };
  dataStoreSpecs?: Record<string, unknown>;
  toolSelection?: { tool?: { name: string }[] };
  updateTime?: string;
  sharingConfig?: { scope?: string };
  ownerUserPrincipal?: string;
  userAnnotations?: { pinned?: boolean; viewed?: boolean };
}

export interface DiscoveryEngineSession {
  name: string;
  displayName?: string;
  state?: string;
  userPseudoId?: string;
  turns?: SessionTurn[];
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SessionTurn {
  query?: {
    text?: string;
    queryId?: string;
  };
  answer?: string;
  assistAnswer?: string;
  detailedAssistAnswer?: AssistAnswer;
  queryConfig?: Record<string, string>;
  reply?: {
    reply?: string;
  };
  [key: string]: unknown;
}

export interface AnswerResponse {
  answer?: {
    name?: string;
    state?: string;
    answerText?: string;
    citations?: Array<{
      startIndex?: number;
      endIndex?: number;
      sources?: Array<{
        referenceId?: string;
      }>;
    }>;
    references?: Array<{
      chunkInfo?: {
        chunk?: string;
        content?: string;
        documentMetadata?: {
          document?: string;
          uri?: string;
          title?: string;
        };
      };
    }>;
    steps?: Array<{
      state?: string;
      description?: string;
      actions?: Array<{
        searchAction?: {
          query?: string;
        };
        observation?: {
          searchResults?: Array<{
            document?: string;
            uri?: string;
            title?: string;
            snippetInfo?: Array<{
              snippet?: string;
            }>;
          }>;
        };
      }>;
    }>;
    [key: string]: unknown;
  };
  session?: DiscoveryEngineSession;
  [key: string]: unknown;
}

export interface StreamAssistReply {
  groundedContent?: {
    content?: {
      role?: string;
      text?: string;
      thought?: boolean;
    };
  };
  reply?: string;
  replyId?: string;
  agent?: string;
  createTime?: string;
}

export interface StreamAssistChunk {
  answer?: {
    name?: string;
    state?: string;
    reply?: { reply?: string };
    replies?: StreamAssistReply[];
    assistSkippedReasons?: string[];
    [key: string]: unknown;
  };
  sessionInfo?: {
    session?: string;
    queryId?: string;
  };
  statusUpdates?: Array<{
    updateText?: string;
  }>;
  assistToken?: string;
  [key: string]: unknown;
}

export interface StreamAssistResult {
  fullText: string;
  sessionInfo: { session?: string; queryId?: string } | null;
  answerState: string;
}

export interface ListAgentsResponse {
  agents?: DiscoveryEngineAgent[];
  nextPageToken?: string;
}

export interface ListAgentViewsResponse {
  agentViews?: AgentView[];
}

export interface ListSessionsResponse {
  sessions?: DiscoveryEngineSession[];
  nextPageToken?: string;
}

// ─── Error Handling ──────────────────────────────────────────────

export class DiscoveryEngineError extends Error {
  status: number;
  isAuthError: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DiscoveryEngineError';
    this.status = status;
    this.isAuthError = status === 401 || status === 403;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Discovery Engine API error (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // Use default error message
    }
    throw new DiscoveryEngineError(errorMessage, response.status);
  }
  return response.json() as Promise<T>;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Goog-User-Project': PROJECT_NUMBER,
  };
}

// ─── Engine & DataStore APIs ─────────────────────────────────────

export interface EngineConfig {
  name: string;
  displayName?: string;
  dataStoreIds?: string[];
  features?: Record<string, string>;
  modelConfigs?: Record<string, string>;
  marketplaceAgentVisibility?: string;
  [key: string]: unknown;
}

export interface DataStoreInfo {
  name: string;
  displayName?: string;
  contentConfig?: string;
  workspaceConfig?: {
    type?: string; // "GOOGLE_DRIVE" | "GOOGLE_MAIL" | "GOOGLE_CALENDAR" | etc.
  };
  [key: string]: unknown;
}

/**
 * Get engine configuration (includes dataStoreIds).
 */
export async function getEngine(
  accessToken: string,
): Promise<EngineConfig> {
  const url = `${BASE_URL}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<EngineConfig>(response);
}

/**
 * Get a specific data store by ID.
 */
export async function getDataStore(
  accessToken: string,
  dataStoreId: string,
): Promise<DataStoreInfo> {
  const url = `https://discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_NUMBER}/locations/${LOCATION}/collections/default_collection/dataStores/${dataStoreId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<DataStoreInfo>(response);
}

// ─── Agent APIs ──────────────────────────────────────────────────

/**
 * List agents under the assistant.
 * GET .../assistants/{assistant}/agents
 * Supports optional filter, pageSize, and pageToken query params.
 */
export async function listAgents(
  accessToken: string,
  filter?: string,
  pageSize?: number,
): Promise<ListAgentsResponse> {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (pageSize) params.set('pageSize', String(pageSize));
  const qs = params.toString();
  const url = `${ASSISTANT_PATH}/agents${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<ListAgentsResponse>(response);
}

/**
 * List available agent views (richer data than listAgents).
 * POST .../assistants/{assistant}:listAvailableAgentViews
 */
export async function listAvailableAgentViews(
  accessToken: string,
): Promise<ListAgentViewsResponse> {
  const url = `${ASSISTANT_PATH}:listAvailableAgentViews`;
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({}),
  });
  return handleResponse<ListAgentViewsResponse>(response);
}

/**
 * Get a specific agent by name/ID.
 * GET .../assistants/{assistant}/agents/{agent}
 */
export async function getAgent(
  accessToken: string,
  agentId: string
): Promise<DiscoveryEngineAgent> {
  const url = `${ASSISTANT_PATH}/agents/${agentId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<DiscoveryEngineAgent>(response);
}

/**
 * Delete a specific agent.
 * DELETE .../assistants/{assistant}/agents/{agent}
 */
export async function deleteAgent(
  accessToken: string,
  agentId: string
): Promise<void> {
  const url = `${ASSISTANT_PATH}/agents/${agentId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new DiscoveryEngineError(
      `Failed to delete agent (${response.status})`,
      response.status
    );
  }
}

/**
 * Create a new agent with lowCodeAgentDefinition.
 * POST .../assistants/{assistant}/agents
 */
export interface LowCodeAgentNode {
  id: string;
  displayName: string;
  llmAgentNode: {
    model: string;
    instruction: string;
    description?: string;
    subAgentIds?: string[];
    selectedTools?: {
      tool: { name: string }[];
    };
  };
}

export interface CreateAgentRequest {
  displayName: string;
  description: string;
  lowCodeAgentDefinition: {
    nodes: LowCodeAgentNode[];
    rootAgentId: string;
  };
  dataStoreSpecs?: {
    specs: { dataStore: string }[];
  };
}

export async function createAgent(
  accessToken: string,
  agentData: CreateAgentRequest
): Promise<DiscoveryEngineAgent> {
  const url = `${ASSISTANT_PATH}/agents`;
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(agentData),
  });
  return handleResponse<DiscoveryEngineAgent>(response);
}

/**
 * Update (patch) an existing low-code agent.
 * PATCH .../assistants/{assistant}/agents/{agentId}
 */
export async function patchAgent(
  accessToken: string,
  agentId: string,
  agentData: CreateAgentRequest,
): Promise<DiscoveryEngineAgent> {
  const url = `${ASSISTANT_PATH}/agents/${agentId}?updateMask=displayName,description,lowCodeAgentDefinition,dataStoreSpecs`;
  // The API requires draftDisplayName/draftDescription inside lowCodeAgentDefinition
  const body = {
    ...agentData,
    lowCodeAgentDefinition: {
      ...agentData.lowCodeAgentDefinition,
      draftDisplayName: agentData.displayName,
      draftDescription: agentData.description,
    },
  };
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  return handleResponse<DiscoveryEngineAgent>(response);
}

// ─── Session APIs ────────────────────────────────────────────────

/**
 * Create a new conversation session.
 * POST .../assistants/{assistant}/sessions
 */
export async function createSession(
  accessToken: string,
  userPseudoId?: string
): Promise<DiscoveryEngineSession> {
  const url = `${ASSISTANT_PATH}/sessions`;
  const body: Record<string, unknown> = {};
  if (userPseudoId) {
    body.userPseudoId = userPseudoId;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  return handleResponse<DiscoveryEngineSession>(response);
}

/**
 * List sessions.
 * GET .../engines/{engine}/sessions
 * Supports orderBy (e.g. 'update_time desc') and filter.
 */
export async function listSessions(
  accessToken: string,
  pageSize?: number,
  pageToken?: string,
  orderBy?: string,
  filter?: string
): Promise<ListSessionsResponse> {
  const params = new URLSearchParams();
  if (pageSize) params.set('pageSize', String(pageSize));
  if (pageToken) params.set('pageToken', pageToken);
  if (orderBy) params.set('orderBy', orderBy);
  if (filter) params.set('filter', filter);

  const queryStr = params.toString();
  const url = `${BASE_URL}/sessions${queryStr ? '?' + queryStr : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<ListSessionsResponse>(response);
}

/**
 * Get a specific session with its conversation turns.
 * GET .../engines/{engine}/sessions/{session}
 */
export async function getSession(
  accessToken: string,
  sessionId: string
): Promise<DiscoveryEngineSession> {
  const url = `${BASE_URL}/sessions/${sessionId}?includeAnswerDetails=true`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<DiscoveryEngineSession>(response);
}

/**
 * Get an AssistAnswer by its full resource name.
 * GET https://discoveryengine.googleapis.com/v1alpha/{name}
 *
 * The `name` is the full resource path, e.g.:
 * projects/.../sessions/{session}/assistAnswers/{assistAnswer}
 */
export interface AssistAnswer {
  name?: string;
  state?: string;
  replies?: StreamAssistReply[];
  assistSkippedReasons?: string[];
  [key: string]: unknown;
}

export async function getAssistAnswer(
  accessToken: string,
  assistAnswerName: string
): Promise<AssistAnswer> {
  const url = `https://discoveryengine.googleapis.com/v1alpha/${assistAnswerName}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  return handleResponse<AssistAnswer>(response);
}

/**
 * Delete a session.
 * DELETE .../assistants/{assistant}/sessions/{session}
 */
export async function deleteSession(
  accessToken: string,
  sessionId: string
): Promise<void> {
  const url = `${ASSISTANT_PATH}/sessions/${sessionId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new DiscoveryEngineError(
      `Failed to delete session (${response.status})`,
      response.status
    );
  }
}

// ─── Answer/Chat API ─────────────────────────────────────────────

/**
 * Send a query to a session and get an answer from Discovery Engine.
 * POST .../assistants/{assistant}/sessions/{session}:answer
 *
 * This is the main conversational endpoint.
 */
export async function sendQuery(
  accessToken: string,
  sessionId: string,
  queryText: string
): Promise<AnswerResponse> {
  const url = `${ASSISTANT_PATH}/sessions/${sessionId}:answer`;
  const body = {
    query: {
      text: queryText,
    },
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  return handleResponse<AnswerResponse>(response);
}

/**
 * Stream assist - send a query and receive a streamed response.
 * POST .../assistants/{assistant}:streamAssist
 *
 * Uses NDJSON streaming. The response is an array of StreamAssistResponse chunks.
 * Session ID of "-" creates a new session.
 */
export async function streamAssist(
  accessToken: string,
  queryText: string,
  sessionId?: string, // "-" for new session, or full session resource name
  onChunk?: (chunk: StreamAssistChunk) => void,
  agentId?: string,
  dataStoreIds?: string[],
): Promise<StreamAssistResult> {
  const url = `${ASSISTANT_PATH}:streamAssist?alt=sse`;

  // Session: resource path starting from projects/...
  const sessionForApi = `${RESOURCE_PATH}/sessions/${(!sessionId || sessionId === '-') ? '-' : sessionId}`;

  const body: Record<string, unknown> = {
    query: { text: queryText },
    session: sessionForApi,
    assistSkippingMode: 'REQUEST_ASSIST',
  };

  // Build dataStoreSpecs from the enabled IDs
  const buildDataStoreSpecs = (ids: string[]) =>
    ids.map(id => ({
      dataStore: `projects/${PROJECT_NUMBER}/locations/${LOCATION}/collections/default_collection/dataStores/${id}`,
    }));

  // If agentId is provided, match the GE website's agent routing format
  if (agentId) {
    body.answerGenerationMode = 'AGENT';
    body.agentsConfig = { agent: agentId };
    body.agentsSpec = {
      agentSpecs: [{ agentId, version: 'deployed' }],
    };
    body.toolsSpec = {
      toolRegistry: 'default_tool_registry',
      imageGenerationSpec: {},
      videoGenerationSpec: {},
    };
  }

  // Add data store specs only for non-agent calls.
  // When routing to an agent, the agent manages its own data stores server-side.
  if (!agentId && dataStoreIds && dataStoreIds.length > 0) {
    const specs = buildDataStoreSpecs(dataStoreIds);
    // Add to toolsSpec.vertexAiSearchSpec (preferred)
    const toolsSpec = (body.toolsSpec as Record<string, unknown>) || {};
    toolsSpec.vertexAiSearchSpec = { dataStoreSpecs: specs };
    body.toolsSpec = toolsSpec;
    // Also add at top-level for compatibility
    body.dataStoreSpecs = specs;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `streamAssist error (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch { /* ignore */ }
    throw new DiscoveryEngineError(errorMessage, response.status);
  }

  // SSE (Server-Sent Events) format: each event is prefixed with "data: "
  const reader = response.body?.getReader();
  if (!reader) {
    throw new DiscoveryEngineError('No response body', 500);
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  let sessionInfo: { session?: string; queryId?: string } | null = null;
  let answerState = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE format: lines starting with "data: " contain JSON
      const lines = buffer.split('\n');
      // Keep the last line in buffer (it might be incomplete)
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        
        // SSE data lines start with "data: "
        if (!trimmed.startsWith('data: ')) continue;
        
        const jsonStr = trimmed.slice(6); // Remove "data: " prefix
        if (!jsonStr) continue;

        try {
          const chunk = JSON.parse(jsonStr) as StreamAssistChunk;
          
          // Extract answer text from replies
          // The actual text is at replies[i].groundedContent.content.text
          let hasNewContent = false;
          if (chunk.answer?.replies) {
            for (const reply of chunk.answer.replies) {
              const gc = reply.groundedContent?.content;
              if (gc?.text) {
                if (!gc.thought) {
                  fullText += gc.text;
                }
                hasNewContent = true;
              }
            }
          }
          if (hasNewContent) {
            onChunk?.(chunk);
          }
          
          // Track state
          if (chunk.answer?.state) {
            answerState = chunk.answer.state;
          }

          // Capture session info
          if (chunk.sessionInfo) {
            sessionInfo = chunk.sessionInfo;
          }
        } catch {
          // Incomplete JSON, skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    fullText,
    sessionInfo,
    answerState,
  };
}

// ─── Utility ─────────────────────────────────────────────────────

/**
 * Extract the short session ID from the full resource name.
 * e.g., "projects/xxx/locations/global/.../sessions/abc123" → "abc123"
 */
export function extractSessionId(fullName: string): string {
  const parts = fullName.split('/');
  return parts[parts.length - 1];
}

/**
 * Build the full session resource name from a short ID.
 */
export function buildSessionName(sessionId: string): string {
  return `${ASSISTANT_PATH}/sessions/${sessionId}`;
}
