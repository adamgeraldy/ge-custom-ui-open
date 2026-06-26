import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useApp } from '../../../context/AppContext';
import { useI18n } from '../../../context/i18n';
import type { Message } from '../../../context/AppContext';
import { 
  Paperclip, 
  Send, 
  Copy, 
  Share2, 
  ThumbsUp, 
  ThumbsDown,
  FileText,
  Check,
  User,
  Bot,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DataStorePopup } from './DataStorePopup';
import './ChatView.css';

export const ChatView: React.FC = () => {
  const { activeAgent, agents, messages, sendMessage, isStreaming } = useApp();
  const { t } = useI18n();

  // Determine if current agent is a real Discovery Engine agent
  const isRealAgent = activeAgent ? agents.some(a => a.id === activeAgent.id) : false;
  const [inputText, setInputText] = useState('');
  const dsAnchorRef = useRef<HTMLButtonElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());

  const toggleThinking = (msgId: string) => {
    setExpandedThinking(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat feed when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-expand thinking for the latest streaming message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'assistant' && lastMsg.thinkingText && isStreaming) {
      setExpandedThinking(prev => {
        if (prev.has(lastMsg.id)) return prev;
        const next = new Set(prev);
        next.add(lastMsg.id);
        return next;
      });
    }
  }, [messages, isStreaming]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText);
    setInputText('');
  };

  const handleCopyText = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackState(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
  };

  if (!activeAgent) return null;

  return (
    <div className="chat-view animate-fade-in">
      {/* Chat Messages Feed */}
      <div className="chat-feed dark-scroll" ref={chatFeedRef}>
        <div className="feed-container">
          {messages.map((msg: Message) => {
            const isUser = msg.sender === 'user';
            
            return (
              <div 
                key={msg.id} 
                className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}
              >
                {/* Left Avatar for Assistant */}
                {!isUser && (
                  <div className="msg-avatar flex-center assistant-avatar">
                    {isRealAgent && activeAgent ? (
                      <span className="agent-avatar-initial">{activeAgent.name.charAt(0).toUpperCase()}</span>
                    ) : (
                      <Bot className="avatar-svg" />
                    )}
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className="msg-content-col">
                  {/* Agent name label */}
                  {!isUser && isRealAgent && activeAgent && (
                    <span className="agent-name-text">{activeAgent.name}</span>
                  )}
                <div className="msg-bubble-wrapper">
                  <div className={`msg-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                    {/* Collapsible thinking section */}
                    {!isUser && msg.thinkingText && (
                      <div className="thinking-section">
                        <button
                          className="thinking-toggle"
                          onClick={() => toggleThinking(msg.id)}
                        >
                          {expandedThinking.has(msg.id) ? (
                            <>
                              <span>{t('chat.hideThinking')}</span>
                              <ChevronUp className="thinking-chevron" />
                            </>
                          ) : (
                            <>
                              <span>{t('chat.showThinking')}</span>
                              <ChevronDown className="thinking-chevron" />
                            </>
                          )}
                        </button>
                        {expandedThinking.has(msg.id) && (
                          <div className="thinking-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.thinkingText}</ReactMarkdown>
                            <p className="thinking-disclaimer">{t('chat.thinkingDisclaimer')}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="msg-text-content">
                      {msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
                      ) : null}
                      {/* Streaming cursor indicator */}
                      {!isUser && msg.content === '' && isStreaming && (
                        <div className="streaming-indicator">
                          <Loader2 className="streaming-spinner" />
                          <span>{t('chat.thinking')}</span>
                        </div>
                      )}
                    </div>

                    {/* Reference Knowledge Box inside Assistant Message */}
                    {!isUser && msg.references && msg.references.length > 0 && (
                      <div className="reference-box">
                        <div className="reference-title flex-center">
                          <FileText className="reference-icon" />
                          <span>{t('chat.referenceKnowledge')}</span>
                        </div>
                        <ul className="reference-list">
                          {msg.references.map((ref, idx) => (
                            <li key={idx} className="reference-item">
                              <span className="ref-bullet"></span>
                              <span className="ref-text">{ref}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Message Actions Toolbar */}
                  <div className={`msg-toolbar ${isUser ? 'user-toolbar' : 'assistant-toolbar'}`}>
                    <span className="msg-timestamp">{msg.timestamp}</span>
                    
                    {!isUser && (
                      <div className="toolbar-actions flex-center">
                        <button 
                          className="toolbar-btn flex-center" 
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          title={t('chat.copyText')}
                        >
                          {copiedId === msg.id ? (
                            <Check className="toolbar-icon-check" />
                          ) : (
                            <Copy className="toolbar-icon" />
                          )}
                        </button>
                        
                        <button className="toolbar-btn flex-center" title={t('chat.share')}>
                          <Share2 className="toolbar-icon" />
                        </button>
                        
                        <button 
                          className={`toolbar-btn flex-center ${feedbackState[msg.id] === 'up' ? 'active' : ''}`}
                          onClick={() => handleFeedback(msg.id, 'up')}
                          title={t('chat.like')}
                        >
                          <ThumbsUp className="toolbar-icon" />
                        </button>
                        
                        <button 
                          className={`toolbar-btn flex-center ${feedbackState[msg.id] === 'down' ? 'active' : ''}`}
                          onClick={() => handleFeedback(msg.id, 'down')}
                          title={t('chat.dislike')}
                        >
                          <ThumbsDown className="toolbar-icon" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </div>{/* msg-content-col */}

                {/* Right Avatar for User */}
                {isUser && (
                  <div className="msg-avatar flex-center user-avatar">
                    <User className="avatar-svg" />
                  </div>
                )}
              </div>
            );
          })}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="chat-input-bar-container">
        {/* Agent badge above input */}
        {isRealAgent && activeAgent && (
          <div className="agent-input-badge">
            <span className="agent-badge-initial">{activeAgent.name.charAt(0).toUpperCase()}</span>
            <span className="agent-badge-name">{activeAgent.name}</span>
          </div>
        )}
        <form onSubmit={handleSend} className="chat-input-bar flex-between">
          <div className="input-bar-left flex-center">
            <DataStorePopup anchorRef={dsAnchorRef} />
            <button type="button" className="input-icon-btn flex-center" title={t('chat.attachment')}>
              <Paperclip className="input-bar-icon" />
            </button>
          </div>

          <input 
            type="text" 
            placeholder={t('chat.inputPlaceholder', { name: activeAgent?.name || 'BT-GE' })} 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-bar-input-field"
          />

          <button type="submit" className="input-send-btn flex-center" disabled={!inputText.trim() || isStreaming}>
            <Send className="send-icon" />
          </button>
        </form>
      </div>
    </div>
  );
};
