import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  initGoogleAuth,
  getStoredToken,
  getStoredUserInfo,
  isTokenExpired,
  clearStoredAuth,
  type GoogleUserInfo,
} from '../utils/google-auth';
import {
  listAvailableAgentViews as apiListAgentViews,
  deleteAgent as apiDeleteAgent,
  createAgent as apiCreateAgent,
  patchAgent as apiPatchAgent,
  getEngine as apiGetEngine,
  listSessions as apiListSessions,
  getSession as apiGetSession,
  streamAssist as apiStreamAssist,
  type AgentView,
  type DiscoveryEngineSession,
  type StreamAssistChunk,
  type CreateAgentRequest,
} from '../utils/discovery-engine';

// Google OAuth Client ID — configured via environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  tag: string;
  icon: string;
  persona: string;
  isGoogleAgent?: boolean;
  state?: 'PRIVATE' | 'ENABLED' | string;
  sharingScope?: 'ALL_USERS' | 'RESTRICTED' | string;
  agentType?: 'LOW_CODE' | 'MANAGED' | string;
  suggestedPrompts?: string[];
  canEdit?: boolean;
  canDelete?: boolean;
  hasDeployedVersion?: boolean;
  ownerUserPrincipal?: string;
  dataStoreIds?: string[];  // data store IDs used by this agent
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: string[];
  thinkingText?: string;
}

export interface ChatSession {
  id: string;
  agentId: string;
  agentName: string;
  messages: Message[];
  lastMessageText: string;
  timestamp: string;
}

export interface DataStoreItem {
  id: string;
  displayName: string;
  type: 'drive' | 'mail' | 'calendar' | 'generic';
  enabled: boolean;
}

interface AppContextType {
  user: { username: string; role: string; email?: string; picture?: string } | null;
  accessToken: string | null;
  currentView: 'home' | 'agents' | 'chat' | 'agent-editor';
  activeAgent: Agent | null;
  activeChatId: string | null;
  messages: Message[];
  chatHistory: ChatSession[];
  agents: Agent[];
  agentsLoading: boolean;
  isStreaming: boolean;
  sessionsLoading: boolean;
  sessionsHasMore: boolean;
  loadMoreSessions: () => void;
  dataStores: DataStoreItem[];
  dataStoresLoading: boolean;
  toggleDataStore: (id: string) => void;
  toggleAllDataStores: (enabled: boolean) => void;
  agentDataStoreLocked: boolean;  // true when an agent controls the data store selection
  googleClientId: string;
  login: (username: string) => boolean;
  loginWithGoogle: (accessToken: string, expiresIn: number, userInfo: GoogleUserInfo) => void;
  logout: () => void;
  setView: (view: 'home' | 'agents' | 'chat' | 'agent-editor') => void;
  startChat: (agentId: string) => void;
  startNewChat: (initialMessage?: string) => void;
  loadChatSession: (sessionId: string) => void;
  sendMessage: (content: string) => void;
  clearActiveChat: () => void;
  updateAccessToken: (token: string) => void;
  deleteAgent: (agentId: string) => Promise<boolean>;
  createNewAgent: (agentData: CreateAgentRequest) => Promise<boolean>;
  editingAgentId: string | null;
  editAgent: (agentId: string) => void;
  updateAgent: (agentId: string, agentData: CreateAgentRequest) => Promise<boolean>;
}

// Preset Agents based on the screenshots
const PRESET_AGENTS: Agent[] = [
  {
    id: 'ask-sop',
    name: 'Ask SOP & Policy Bank',
    description: 'Mencari informasi terkait SOP dan Policy Bank Toyib',
    tag: 'General',
    icon: 'BookOpen',
    persona: 'Halo! Saya Ask SOP & Policy Bank Agent. Saya akan membantu Anda mencari informasi terkait SOP dan Policy Bank Toyib.'
  },
  {
    id: 'compare-docs',
    name: 'Compare Documents',
    description: 'Analisa dan perbandingan antar dokumen',
    tag: 'Productivity',
    icon: 'Files',
    persona: 'Halo! Saya Compare Documents Agent. Unggah beberapa dokumen Anda, dan saya akan melakukan analisa perbandingan poin-poin utama secara mendalam.'
  },
  {
    id: 'client-insight',
    name: 'Client & Business Insight',
    description: 'Analisis portofolio nasabah, product holdings, expiry alerts, dan tren bisnis.',
    tag: 'Analytics',
    icon: 'TrendingUp',
    persona: 'Halo! Saya Client & Business Insight Agent. Saya siap membantu Anda menganalisa portofolio nasabah, product holdings, expiry alerts, dan performa bisnis.'
  },
  {
    id: 'wealth-mgmt',
    name: 'Wealth Management',
    description: 'Membantu karyawan untuk dapat menganalisa kesehatan keuangan nasabah.',
    tag: 'Employee',
    icon: 'Coins',
    persona: 'Halo! Saya Wealth Management Agent. Saya dapat membantu menganalisis profil investasi, kesehatan keuangan, dan alokasi aset nasabah Anda.'
  },
  {
    id: 'doc-processing',
    name: 'Document Processing',
    description: 'Membaca dan mengekstrak teks dari dokumen cetak maupun digital.',
    tag: 'OCR',
    icon: 'FileText',
    persona: 'Halo! Saya Document Processing Agent. Saya dapat membaca, mengekstrak data terstruktur, dan mengenali tulisan dari dokumen yang Anda berikan.'
  },
  {
    id: 'market-news',
    name: 'Market News & Research',
    description: 'Riset berita terkini, pasar domestik dan internasional.',
    tag: 'News & Research',
    icon: 'Globe',
    persona: 'Halo! Saya Market News & Research Agent. Saya akan menyajikan riset berita terkini serta rangkuman situasi pasar finansial domestik dan global.'
  },
  {
    id: 'employee-assistant',
    name: 'Employee Assistant',
    description: 'Chatbot untuk karyawan Bank Toyib - tanya policy, absensi, dan internal.',
    tag: 'HR Services',
    icon: 'Users',
    persona: 'Halo! Saya Employee Assistant Agent. Ada yang bisa saya bantu terkait kebijakan internal, absensi, sisa cuti, atau informasi benefit Bank Toyib?'
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: string; email?: string; picture?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'agents' | 'chat' | 'agent-editor'>('home');
  const setView = useCallback((view: 'home' | 'agents' | 'chat' | 'agent-editor') => {
    // When navigating to agent-editor via sidebar (not editAgent), clear editing state
    if (view === 'agent-editor') {
      setEditingAgentId(null);
    }
    setCurrentView(view);
  }, []);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>(PRESET_AGENTS);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsNextPageToken, setSessionsNextPageToken] = useState<string | null>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const [dataStores, setDataStores] = useState<DataStoreItem[]>([]);
  const [dataStoresLoading, setDataStoresLoading] = useState(false);

  // Convert AgentView responses to our Agent type
  // Extract data store IDs from an agent view's dataStoreSpecs
  // API returns: dataStoreSpecs: { specs: [{ dataStore: "projects/.../dataStores/{id}" }] }
  // or empty: dataStoreSpecs: {}
  const extractAgentDataStoreIds = (view: AgentView): string[] => {
    const ids: string[] = [];
    const specs = view.dataStoreSpecs;
    if (specs && typeof specs === 'object') {
      const arr = (specs as Record<string, unknown>)['specs'];
      if (Array.isArray(arr)) {
        for (const s of arr) {
          const dsName = (s as Record<string, unknown>)?.dataStore;
          if (typeof dsName === 'string') {
            const parts = dsName.split('/');
            ids.push(parts[parts.length - 1]);
          }
        }
      }
    }
    return ids;
  };

  const mapAgentViews = (views: AgentView[]): Agent[] => {
    const mapped = views.map((view) => {
      // Extract the short ID from the full resource name
      const nameParts = view.name.split('/');
      const shortId = nameParts[nameParts.length - 1];
      const displayName = view.displayName || view.name || 'Unnamed Agent';
      const isGoogleAgent = view.agentOrigin === 'GOOGLE';
      const state = view.state || 'PRIVATE';
      const sharingScope = view.sharingConfig?.scope || '';
      
      return {
        id: shortId,
        name: displayName,
        description: view.description || `Discovery Engine Agent: ${displayName}`,
        tag: isGoogleAgent ? 'Google' : 'Custom',
        icon: displayName.charAt(0).toUpperCase(),
        persona: `Halo! Saya ${displayName}. Silakan tanyakan apa saja kepada saya.`,
        isGoogleAgent,
        state,
        sharingScope,
        agentType: view.agentType,
        suggestedPrompts: view.suggestedPrompts?.map(p => p.text),
        canEdit: view.userPermissions?.canEdit,
        canDelete: view.userPermissions?.canDelete,
        hasDeployedVersion: view.lowCodeAgentInfo?.hasDeployedVersion,
        ownerUserPrincipal: view.ownerUserPrincipal,
        dataStoreIds: extractAgentDataStoreIds(view),
      };
    });

    // Sort: Google-made agents first, then by name
    mapped.sort((a, b) => {
      if (a.isGoogleAgent && !b.isGoogleAgent) return -1;
      if (!a.isGoogleAgent && b.isGoogleAgent) return 1;
      return a.name.localeCompare(b.name);
    });

    return mapped;
  };

  // Convert Discovery Engine sessions to ChatSession format
  const mapDiscoverySessions = (deSessions: DiscoveryEngineSession[], currentAgents: Agent[]): ChatSession[] => {
    return deSessions.map((session) => {
      const nameParts = session.name.split('/');
      const shortId = nameParts[nameParts.length - 1];
      const displayName = session.displayName || 'Chat Session';
      
      // Try to match session displayName to a known agent
      const matchedAgent = currentAgents.find(a => a.name === displayName);
      
      // Extract last message from turns
      const lastTurn = session.turns?.[session.turns.length - 1];
      const lastMessage = lastTurn?.answer || lastTurn?.query?.text || 'No messages yet';
      
      // Format the timestamp
      let timeStr = '';
      if (session.updateTime) {
        const d = new Date(session.updateTime);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
        if (isToday) {
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (isYesterday) {
          timeStr = 'Yesterday';
        } else {
          timeStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      }
      
      // Try to truncate lastMessage for preview
      const preview = lastMessage.length > 80 ? lastMessage.substring(0, 80) + '...' : lastMessage;
      
      return {
        id: shortId,
        agentId: matchedAgent?.id || shortId,
        agentName: displayName,
        messages: [], // Messages loaded on demand
        lastMessageText: preview,
        timestamp: timeStr,
      };
    });
  };

  // Fetch agents from Discovery Engine
  const fetchAgents = useCallback(async (token: string) => {
    setAgentsLoading(true);
    try {
      const response = await apiListAgentViews(token);
      if (response.agentViews && response.agentViews.length > 0) {
        const mapped = mapAgentViews(response.agentViews);
        setAgents(mapped);
      } else {
        setAgents(PRESET_AGENTS);
      }
    } catch (err) {
      setAgents(PRESET_AGENTS);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  // Fetch data stores from engine config (infer type from ID suffix)
  const fetchDataStores = useCallback(async (token: string) => {
    setDataStoresLoading(true);
    try {
      const engine = await apiGetEngine(token);
      const dsIds = engine.dataStoreIds || [];
      const dsItems: DataStoreItem[] = dsIds.map((dsId) => {
        let type: DataStoreItem['type'] = 'generic';
        let name: string;

        if (dsId.endsWith('_google_drive')) {
          type = 'drive';
          name = 'Drive';
        } else if (dsId.endsWith('_google_mail')) {
          type = 'mail';
          name = 'Mail';
        } else if (dsId.endsWith('_google_calendar')) {
          type = 'calendar';
          name = 'Calendar';
        } else {
          // Strip trailing numeric ID (e.g. "fsi-external-datastore_1771394594537" → "fsi-external-datastore")
          name = dsId.replace(/_\d+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        return { id: dsId, displayName: name, type, enabled: true };
      });
      setDataStores(dsItems);
    } catch (err) {
    } finally {
      setDataStoresLoading(false);
    }
  }, []);

  const toggleDataStore = useCallback((id: string) => {
    setDataStores(prev => prev.map(ds => ds.id === id ? { ...ds, enabled: !ds.enabled } : ds));
  }, []);

  const toggleAllDataStores = useCallback((enabled: boolean) => {
    setDataStores(prev => prev.map(ds => ({ ...ds, enabled })));
  }, []);

  // Fetch sessions from Discovery Engine
  const fetchSessions = useCallback(async (token: string, pageToken?: string) => {
    setSessionsLoading(true);
    try {
      const response = await apiListSessions(token, 5, pageToken || undefined, 'update_time desc');
      const newSessions = response.sessions ? mapDiscoverySessions(response.sessions, agents) : [];
      
      if (pageToken) {
        // Append to existing
        setChatHistory(prev => [...prev, ...newSessions]);
      } else {
        // Replace (first load)
        setChatHistory(newSessions);
      }
      
      setSessionsNextPageToken(response.nextPageToken || null);
    } catch (err) {
      if (!pageToken) {
        setChatHistory([]);
      }
      setSessionsNextPageToken(null);
    } finally {
      setSessionsLoading(false);
    }
  }, [agents]);

  const loadMoreSessions = useCallback(() => {
    if (accessToken && sessionsNextPageToken && !sessionsLoading) {
      fetchSessions(accessToken, sessionsNextPageToken);
    }
  }, [accessToken, sessionsNextPageToken, sessionsLoading, fetchSessions]);

  // Sessions are now loaded from Discovery Engine API after login

  // Restore Google auth session on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUserInfo();

    if (storedToken && storedUser && !isTokenExpired()) {
      setAccessToken(storedToken.accessToken);
      setUser({
        username: storedUser.name,
        role: 'Google User',
        email: storedUser.email,
        picture: storedUser.picture,
      });

      // Fetch real agents from Discovery Engine
      fetchAgents(storedToken.accessToken);
      fetchSessions(storedToken.accessToken);
      fetchDataStores(storedToken.accessToken);

      // Initialize auto-refresh
      const remainingMs = storedToken.expiresAt - Date.now();
      const remainingSec = Math.floor(remainingMs / 1000);
      if (remainingSec > 0) {
        initGoogleAuth(GOOGLE_CLIENT_ID, {
          onRefreshed: (newToken) => {
            setAccessToken(newToken);
          },
          onError: () => {
            // Token refresh failed — force re-login
            handleLogout();
          },
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (username: string): boolean => {
    if (username.trim().length >= 6) {
      setUser({ username, role: 'Standard User' });
      setView('home');
      return true;
    }
    return false;
  };

  const loginWithGoogle = useCallback((token: string, _expiresIn: number, userInfo: GoogleUserInfo) => {
    setAccessToken(token);
    setUser({
      username: userInfo.name,
      role: 'Google User',
      email: userInfo.email,
      picture: userInfo.picture,
    });
    setView('home');

    // Fetch real agents from Discovery Engine
    fetchAgents(token);
    fetchSessions(token);
    fetchDataStores(token);

    // Set up auto-refresh callbacks
    initGoogleAuth(GOOGLE_CLIENT_ID, {
      onRefreshed: (newToken) => {
        setAccessToken(newToken);
      },
      onError: () => {
        handleLogout();
      },
    });
  }, [fetchAgents]);

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setView('home');
    setActiveAgent(null);
    setActiveChatId(null);
    setMessages([]);
    clearStoredAuth();
  };

  const logout = () => {
    handleLogout();
  };

  const updateAccessToken = useCallback((token: string) => {
    setAccessToken(token);
  }, []);

  const deleteAgent = useCallback(async (agentId: string): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      await apiDeleteAgent(accessToken, agentId);
      // Remove agent from local state
      setAgents(prev => prev.filter(a => a.id !== agentId));
      return true;
    } catch (err) {
      return false;
    }
  }, [accessToken]);

  const createNewAgent = useCallback(async (agentData: CreateAgentRequest): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      await apiCreateAgent(accessToken, agentData);
      // Refresh agents list
      const freshResponse = await apiListAgentViews(accessToken);
      setAgents(mapAgentViews(freshResponse.agentViews || []));
      setView('agents');
      return true;
    } catch (err) {
      return false;
    }
  }, [accessToken]);

  const editAgent = useCallback((agentId: string) => {
    setEditingAgentId(agentId);
    setCurrentView('agent-editor');
  }, []);

  const updateAgent = useCallback(async (agentId: string, agentData: CreateAgentRequest): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      await apiPatchAgent(accessToken, agentId, agentData);
      // Refresh agents list
      const freshResponse = await apiListAgentViews(accessToken);
      setAgents(mapAgentViews(freshResponse.agentViews || []));
      setView('agents');
      setEditingAgentId(null);
      return true;
    } catch (err) {
      return false;
    }
  }, [accessToken]);

  const startChat = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId) || agents[0];
    
    setActiveAgent(agent);
    setView('chat');

    // Set data store toggles based on agent's config:
    // - Agent has specific dataStoreIds → those ON, rest OFF (locked)
    // - Agent has empty dataStoreSpecs → all OFF (locked)
    if (agent.dataStoreIds && agent.dataStoreIds.length > 0) {
      const agentDsIds = new Set(agent.dataStoreIds);
      setDataStores(prev => prev.map(ds => ({
        ...ds,
        enabled: agentDsIds.has(ds.id),
      })));
    } else {
      // No data stores attached to this agent — all OFF
      setDataStores(prev => prev.map(ds => ({ ...ds, enabled: false })));
    }

    // Always start a fresh session — we'll create a real session on first message
    const tempSessionId = `session-${Date.now()}`;
    setActiveChatId(tempSessionId);
    setMessages([]);
  };

  const startNewChat = (initialMessage?: string) => {
    // Create a general BT-GE agent placeholder (no specific agent)
    const generalAgent: Agent = {
      id: 'bt-ge-general',
      name: 'BT-GE',
      description: 'General AI Assistant',
      tag: 'General',
      icon: 'B',
      persona: '',
    };

    setActiveAgent(generalAgent);
    setView('chat');
    const tempSessionId = `session-${Date.now()}`;
    setActiveChatId(tempSessionId);
    setMessages([]);

    // Store pending message to be sent after state settles (via useEffect)
    if (initialMessage?.trim()) {
      pendingMessageRef.current = initialMessage;
    }
  };

  // Send pending message once activeAgent is ready (fixes stale closure from startNewChat)
  useEffect(() => {
    if (pendingMessageRef.current && activeAgent && accessToken) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAgent, accessToken]);

  const loadChatSession = async (sessionId: string) => {
    if (!accessToken) return;
    
    // Find the session in chat history for metadata
    const session = chatHistory.find(s => s.id === sessionId);
    
    // Try to find the real agent from our agents list
    const realAgent = session?.agentId ? agents.find(a => a.id === session.agentId) : null;
    
    if (realAgent) {
      setActiveAgent(realAgent);
    } else {
      // Fallback: temporary agent for session title
      const tempAgent: Agent = {
        id: session?.agentId || sessionId,
        name: session?.agentName || 'Chat Session',
        description: 'Loading session...',
        tag: 'Session',
        icon: (session?.agentName || 'C').charAt(0).toUpperCase(),
        persona: '',
      };
      setActiveAgent(tempAgent);
    }
    setActiveChatId(sessionId);
    setMessages([]);
    setView('chat');
    
    // Fetch full session with turns from the API
    try {
      const fullSession = await apiGetSession(accessToken, sessionId);
      
      // Convert turns to Message[]
      const loadedMessages: Message[] = [];
      let detectedAgentId: string | null = null;
      
      if (fullSession.turns) {
        for (const turn of fullSession.turns) {
          // User query
          if (turn.query?.text) {
            loadedMessages.push({
              id: `msg-q-${turn.query.queryId || loadedMessages.length}`,
              sender: 'user',
              content: turn.query.text,
              timestamp: '',
            });
          }
          
          // Assistant answer — use detailedAssistAnswer from includeAnswerDetails=true
          const detailedAnswer = turn.detailedAssistAnswer;
          
          if (detailedAnswer?.replies && Array.isArray(detailedAnswer.replies)) {
            let answerText = '';
            let thinkingText = '';
            
            for (const reply of detailedAnswer.replies) {
              // Capture agent ID from reply if present
              if (reply.agent && !detectedAgentId) {
                detectedAgentId = reply.agent;
              }
              const gc = reply.groundedContent?.content;
              if (gc?.text) {
                if (gc.thought) {
                  thinkingText += gc.text;
                } else {
                  answerText += gc.text;
                }
              }
            }
            
            if (answerText) {
              loadedMessages.push({
                id: `msg-a-${turn.query?.queryId || loadedMessages.length}`,
                sender: 'assistant',
                content: answerText,
                timestamp: '',
                thinkingText: thinkingText || undefined,
              });
            }
          }
          
          // Fallback: check queryConfig for AGENT mode
          if (!detectedAgentId && turn.queryConfig) {
            const mode = turn.queryConfig['google.discoveryengine.googleapis.com.Assistant.answer_generation_mode'];
            if (mode === 'AGENT') {
              // We know an agent was used but don't know which — try displayName match
              const matchedByName = agents.find(a => a.name === fullSession.displayName);
              if (matchedByName) {
                detectedAgentId = matchedByName.id;
              }
            }
          }
        }
      }
      
      // If we detected an agent ID, update activeAgent to the real agent
      if (detectedAgentId) {
        const realAgent = agents.find(a => a.id === detectedAgentId);
        if (realAgent) {
          setActiveAgent(realAgent);
        }
      }
      
      setMessages(loadedMessages);
    } catch (err) {
      setMessages([{
        id: 'error-msg',
        sender: 'assistant',
        content: 'Failed to load session messages. The session may have expired or been deleted.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  };

  const clearActiveChat = () => {
    setActiveAgent(null);
    setActiveChatId(null);
    setMessages([]);
    setView('home');
  };



  // Send message via Discovery Engine streamAssist API
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeAgent || !accessToken) return;
    if (isStreaming) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content,
      timestamp: timeStr
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Create a placeholder assistant message for streaming
    const assistantMsgId = `msg-${Date.now()}-assistant`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: timeStr
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      // Determine session ID:
      // - If activeChatId is a real session ID (from Discovery Engine), use it
      // - Otherwise use "-" for new session
      const sessionIdForApi = activeChatId && !activeChatId.startsWith('session-') 
        ? activeChatId 
        : '-';

      // Determine if we should pass agent ID
      // Only pass for real agents (from catalog), not for session IDs
      // Check if the activeAgent.id corresponds to an actual agent in our list
      const isRealAgent = agents.some(a => a.id === activeAgent.id);
      const agentIdForApi = isRealAgent ? activeAgent.id : undefined;

      // Collect enabled data store IDs to pass to the API
      const enabledDataStoreIds = dataStores
        .filter(ds => ds.enabled)
        .map(ds => ds.id);

      let streamedText = '';
      let streamedThinking = '';

      const result = await apiStreamAssist(
        accessToken,
        content,
        sessionIdForApi,
        (_chunk: StreamAssistChunk) => {
          if (_chunk.answer?.replies) {
            for (const r of _chunk.answer.replies) {
              const gc = r.groundedContent?.content;
              if (gc?.text) {
                if (gc.thought) {
                  streamedThinking += gc.text;
                } else {
                  streamedText += gc.text;
                }
              }
            }
          }
          
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, content: streamedText, thinkingText: streamedThinking || undefined }
                : m
            )
          );
        },
        agentIdForApi,
        enabledDataStoreIds.length > 0 ? enabledDataStoreIds : undefined,
      );

      // Final update with full text
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: result.fullText || streamedText || 'No response received.', thinkingText: streamedThinking || undefined }
            : m
        )
      );

      // If a new session was created, update the activeChatId
      if (result.sessionInfo?.session) {
        const newSessionParts = result.sessionInfo.session.split('/');
        const newSessionShortId = newSessionParts[newSessionParts.length - 1];
        
        if (sessionIdForApi === '-') {
          // Update active chat ID to the new session
          setActiveChatId(newSessionShortId);
          
          // Add to chat history
          const newSession: ChatSession = {
            id: newSessionShortId,
            agentId: activeAgent.id,
            agentName: activeAgent.name,
            lastMessageText: content,
            timestamp: timeStr,
            messages: [],
          };
          setChatHistory(prev => [newSession, ...prev]);
        }
      }

      // Update history with latest message
      setChatHistory(prev =>
        prev.map(s =>
          s.id === activeChatId || (result.sessionInfo?.session && s.id === activeChatId)
            ? { ...s, lastMessageText: content, timestamp: timeStr }
            : s
        )
      );


    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'Failed to get response. Please try again.'}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        accessToken,
        currentView,
        activeAgent,
        activeChatId,
        messages,
        chatHistory,
        agents,
        agentsLoading,
        isStreaming,
        sessionsLoading,
        sessionsHasMore: !!sessionsNextPageToken,
        loadMoreSessions,
        dataStores,
        dataStoresLoading,
        toggleDataStore,
        toggleAllDataStores,
        agentDataStoreLocked: !!(activeAgent && agents.some(a => a.id === activeAgent.id)),
        googleClientId: GOOGLE_CLIENT_ID,
        login,
        loginWithGoogle,
        logout,
        setView,
        startChat,
        startNewChat,
        loadChatSession,
        sendMessage,
        clearActiveChat,
        updateAccessToken,
        deleteAgent,
        createNewAgent,
        editingAgentId,
        editAgent,
        updateAgent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
