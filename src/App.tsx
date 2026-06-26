import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { I18nProvider } from './context/i18n';
import { ThemeProvider } from './context/theme';
import { LoginForm } from './components/features/auth/LoginForm';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardHome } from './components/features/agents/DashboardHome';
import { AgentsPage } from './components/features/agents/AgentsPage';
import { ChatView } from './components/features/chat/ChatView';
import { AgentEditorView } from './components/features/agent-editor/AgentEditorView';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { user, currentView } = useApp();

  // If not logged in, show Microsoft LDAP Login Screen
  if (!user) {
    return <LoginForm />;
  }

  // Choose sub-view inside the main layout shell
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <DashboardHome />;
      case 'agents':
        return <AgentsPage />;
      case 'chat':
        return <ChatView />;
      case 'agent-editor':
        return <AgentEditorView />;
      default:
        return <DashboardHome />;
    }
  };

  return <MainLayout>{renderView()}</MainLayout>;
};

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
