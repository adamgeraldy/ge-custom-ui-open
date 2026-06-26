import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ── Translation dictionaries ──────────────────────────────────
const en: Record<string, string> = {
  // Navigation
  'nav.home': 'Home',
  'nav.agents': 'AI Agents',
  'nav.createAgent': 'Create Agent',
  'nav.chatHistory': 'Chat History',
  'nav.settings': 'Settings',
  'nav.noRecentChats': 'No recent chats',
  'nav.loading': 'Loading...',
  'nav.showMore': 'Show more',

  // Header
  'header.newChat': 'New Chat',
  'header.breadcrumbHome': 'Home',
  'header.breadcrumbTitle': 'BT-GE AI Assistant v1.0',

  // Dashboard
  'dashboard.welcome': 'Hi {{name}}! Welcome to BT-GE',
  'dashboard.subtitle': 'Ask a question here or choose an AI Agent that fits your needs',
  'dashboard.catalog': 'Agent Catalog',
  'dashboard.catalogDesc': 'Choose an agent that fits your needs',
  'dashboard.inputPlaceholder': 'Ask BT-GE something...',
  'dashboard.loadingAgents': 'Loading agents from Discovery Engine...',

  // Agents page
  'agents.title': 'AI Agents',
  'agents.description': 'Discover and use specialized AI agents designed to accelerate your work.',
  'agents.searchPlaceholder': 'Search agent name or description...',
  'agents.showing': 'Showing {{count}} of {{total}} agents',
  'agents.noResults': 'No Agents Found',
  'agents.noResultsDesc': 'Try changing your search or reset filters to see the full catalog.',
  'agents.resetSearch': 'Reset Search',

  // Agent Card
  'agentCard.public': 'PUBLIC',
  'agentCard.private': 'PRIVATE',
  'agentCard.restricted': 'RESTRICTED',
  'agentCard.moreOptions': 'More options',
  'agentCard.editAgent': 'Edit Agent',
  'agentCard.deleteAgent': 'Delete Agent',
  'agentCard.deleting': 'Deleting...',
  'agentCard.deleteConfirm': 'Delete agent "{{name}}"? This cannot be undone.',
  'agentCard.google': 'Google',

  // Chat
  'chat.inputPlaceholder': 'Ask {{name}} something...',
  'chat.showThinking': 'Show thinking',
  'chat.hideThinking': 'Hide thinking',
  'chat.thinkingDisclaimer': 'Thinking details are available only in English.',
  'chat.thinking': 'Thinking...',
  'chat.referenceKnowledge': 'Reference Knowledge:',
  'chat.copyText': 'Copy text',
  'chat.share': 'Share',
  'chat.like': 'Like',
  'chat.dislike': 'Dislike',
  'chat.attachment': 'Attachment',

  // Agent Editor
  'editor.back': 'Back',
  'editor.agentNamePlaceholder': 'Agent name...',
  'editor.editing': 'Editing',
  'editor.addNode': 'Add Node',
  'editor.saving': 'Saving...',
  'editor.saveAgent': 'Save Agent',
  'editor.updateAgent': 'Update Agent',
  'editor.loadingAgent': 'Loading agent...',
  'editor.newAgent': 'New Agent',
  'editor.rootInstruction': 'You are the root agent. Describe your behavior here.',
  'editor.subInstruction': 'You are a sub-agent. Describe your task here.',
  'editor.noNodeDef': 'Agent has no node definition.',

  // Node Properties
  'nodeProps.title': 'Node Properties',
  'nodeProps.agentName': 'Agent Name',
  'nodeProps.agentNamePlaceholder': 'Agent name',
  'nodeProps.description': 'Description',
  'nodeProps.descriptionPlaceholder': 'Brief description of what this agent does...',
  'nodeProps.model': 'Model',
  'nodeProps.instructions': 'Instructions',
  'nodeProps.instructionsPlaceholder': 'You are an agent that...',
  'nodeProps.tools': 'Tools',
  'nodeProps.dataSources': 'Data Sources',
  'nodeProps.dataSourcesHint': 'Select data stores this agent can search.',
  'nodeProps.deleteNode': 'Delete Node',
  'nodeProps.rootAgent': 'Root Agent',
  'nodeProps.subAgent': 'Sub Agent',
  'nodeProps.untitled': 'Untitled',
  'nodeProps.googleSearch': 'Google Search',
  'nodeProps.codeExecution': 'Code Execution',
  'nodeProps.urlFetch': 'URL Fetch',

  // Data Store
  'dataStore.title': 'Data Sources',
  'dataStore.loading': 'Loading data sources...',
  'dataStore.empty': 'No data sources connected',
  'dataStore.managedBy': 'Managed by {{name}}',
  'dataStore.enableAll': 'Enable all connectors',

  // Login
  'login.title': 'BT-GE AI Assistant',
  'login.subtitle': 'Powered by Gemini Enterprise',
  'login.signInGoogle': 'Sign in with Google',
  'login.googleHint': 'Use your Google Workspace account to access GCP APIs',
  'login.or': 'OR',
  'login.ldapTitle': 'Microsoft LDAP Login',
  'login.ldapSubtitle': 'Sign in with your corporate credentials',
  'login.ldapUnavailable': 'Currently Unavailable',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.ldapDomain': 'LDAP Domain: ',
  'login.ldapDomainValue': 'TOYIB.CO.ID',
  'login.ldapAuth': 'Authentication via Microsoft Active Directory',
  'login.signInLDAP': 'Sign In with LDAP',
  'login.footerAuth': 'Secure authentication powered by Google Cloud Platform',
  'login.footerVersion': 'BT-GE v1.0 | Powered by Gemini Enterprise',
  'login.googleNotice': 'Google Sign-In:',
  'login.googleNoticeDesc': 'Use your Google account to authenticate and access Discovery Engine APIs',
  'login.usernameError': 'Username must be at least 6 characters.',
  'login.passwordError': 'Password must be at least 6 characters.',
  'login.ldapError': 'LDAP Authentication failed. Please check your credentials.',
  'login.googleError': 'Google Sign-In failed.',

  // Settings
  'settings.title': 'Portal Settings',
  'settings.desc': 'Configure local frontend preferences for this session.',
  'settings.tabGeneral': 'General',
  'settings.tabLocalization': 'Localization',
  'settings.tabAppearance': 'Appearance',
  'settings.showReferences': 'Show Reference Knowledge',
  'settings.showReferencesDesc': 'Toggle file source indicators inside chat messages',
  'settings.language': 'Language',
  'settings.languageDesc': 'Select the interface language',
  'settings.done': 'Done',
  'settings.locSearchPlaceholder': 'Search translations...',
  'settings.locEnglish': 'English',
  'settings.locIndonesian': 'Indonesian',
  'settings.locResetAll': 'Reset All to Defaults',
  'settings.colorPresets': 'Color Presets',
  'settings.colorCustom': 'Custom Colors',
  'settings.colorPrimary': 'Primary',
  'settings.colorAccent': 'Accent',
  'settings.colorError': 'Error',
  'settings.colorReset': 'Reset to Defaults',

  // Common
  'common.loading': 'Loading...',
  'common.yesterday': 'Yesterday',
  'common.noMessages': 'No messages yet',
  'common.noResponse': 'No response received.',
  'common.errorFallback': 'Failed to get response. Please try again.',
  'common.cancel': 'Cancel',
  'common.submit': 'Submit',

  // Footer
  'footer.version': 'BT-GE v1.0',
  'footer.powered': 'Powered by Gemini Enterprise',
  'footer.brand': 'BT-GE',
  'footer.tagline': 'Gemini Enterprise Assistant',
};

const id: Record<string, string> = {
  'nav.home': 'Beranda',
  'nav.agents': 'Agen AI',
  'nav.createAgent': 'Buat Agen',
  'nav.chatHistory': 'Riwayat Chat',
  'nav.settings': 'Pengaturan',
  'nav.noRecentChats': 'Tidak ada chat terbaru',
  'nav.loading': 'Memuat...',
  'nav.showMore': 'Tampilkan lebih',

  'header.newChat': 'Chat Baru',
  'header.breadcrumbHome': 'Beranda',
  'header.breadcrumbTitle': 'BT-GE AI Assistant v1.0',

  'dashboard.welcome': 'Hai {{name}}! Selamat datang di BT-GE',
  'dashboard.subtitle': 'Langsung bertanya disini atau memilih Agent AI sesuai dengan kebutuhanmu',
  'dashboard.catalog': 'Katalog Agent',
  'dashboard.catalogDesc': 'Pilih agent yang sesuai dengan kebutuhan Anda',
  'dashboard.inputPlaceholder': 'Tanyakan sesuatu kepada BT-GE...',
  'dashboard.loadingAgents': 'Memuat agen dari Discovery Engine...',

  'agents.title': 'Agen AI',
  'agents.description': 'Temukan dan gunakan agen AI khusus yang dirancang untuk mempercepat pekerjaan Anda.',
  'agents.searchPlaceholder': 'Cari nama agent atau deskripsi...',
  'agents.showing': 'Menampilkan {{count}} dari {{total}} agent',
  'agents.noResults': 'Tidak Ada Agent Ditemukan',
  'agents.noResultsDesc': 'Cobalah untuk mengubah pencarian Anda atau reset filter untuk melihat katalog lengkap.',
  'agents.resetSearch': 'Reset Pencarian',

  'agentCard.public': 'PUBLIK',
  'agentCard.private': 'PRIVAT',
  'agentCard.restricted': 'TERBATAS',
  'agentCard.moreOptions': 'Opsi lainnya',
  'agentCard.editAgent': 'Edit Agen',
  'agentCard.deleteAgent': 'Hapus Agen',
  'agentCard.deleting': 'Menghapus...',
  'agentCard.deleteConfirm': 'Hapus agen "{{name}}"? Tindakan ini tidak dapat dibatalkan.',
  'agentCard.google': 'Google',

  'chat.inputPlaceholder': 'Tanyakan sesuatu kepada {{name}}...',
  'chat.showThinking': 'Tampilkan pemikiran',
  'chat.hideThinking': 'Sembunyikan pemikiran',
  'chat.thinkingDisclaimer': 'Detail pemikiran hanya tersedia dalam bahasa Inggris.',
  'chat.thinking': 'Berpikir...',
  'chat.referenceKnowledge': 'Referensi Pengetahuan:',
  'chat.copyText': 'Salin teks',
  'chat.share': 'Bagikan',
  'chat.like': 'Suka',
  'chat.dislike': 'Tidak suka',
  'chat.attachment': 'Lampiran',

  'editor.back': 'Kembali',
  'editor.agentNamePlaceholder': 'Nama agen...',
  'editor.editing': 'Mengedit',
  'editor.addNode': 'Tambah Node',
  'editor.saving': 'Menyimpan...',
  'editor.saveAgent': 'Simpan Agen',
  'editor.updateAgent': 'Perbarui Agen',
  'editor.loadingAgent': 'Memuat agen...',
  'editor.newAgent': 'Agen Baru',
  'editor.rootInstruction': 'Anda adalah agen utama. Jelaskan perilaku Anda di sini.',
  'editor.subInstruction': 'Anda adalah sub-agen. Jelaskan tugas Anda di sini.',
  'editor.noNodeDef': 'Agen tidak memiliki definisi node.',

  'nodeProps.title': 'Properti Node',
  'nodeProps.agentName': 'Nama Agen',
  'nodeProps.agentNamePlaceholder': 'Nama agen',
  'nodeProps.description': 'Deskripsi',
  'nodeProps.descriptionPlaceholder': 'Deskripsi singkat tentang apa yang dilakukan agen ini...',
  'nodeProps.model': 'Model',
  'nodeProps.instructions': 'Instruksi',
  'nodeProps.instructionsPlaceholder': 'Anda adalah agen yang...',
  'nodeProps.tools': 'Alat',
  'nodeProps.dataSources': 'Sumber Data',
  'nodeProps.dataSourcesHint': 'Pilih data store yang dapat dicari oleh agen ini.',
  'nodeProps.deleteNode': 'Hapus Node',
  'nodeProps.rootAgent': 'Agen Utama',
  'nodeProps.subAgent': 'Sub Agen',
  'nodeProps.untitled': 'Tanpa Judul',
  'nodeProps.googleSearch': 'Google Search',
  'nodeProps.codeExecution': 'Code Execution',
  'nodeProps.urlFetch': 'URL Fetch',

  'dataStore.title': 'Sumber Data',
  'dataStore.loading': 'Memuat sumber data...',
  'dataStore.empty': 'Tidak ada sumber data terhubung',
  'dataStore.managedBy': 'Dikelola oleh {{name}}',
  'dataStore.enableAll': 'Aktifkan semua konektor',

  'login.title': 'BT-GE AI Assistant',
  'login.subtitle': 'Didukung oleh Gemini Enterprise',
  'login.signInGoogle': 'Masuk dengan Google',
  'login.googleHint': 'Gunakan akun Google Workspace Anda untuk mengakses GCP APIs',
  'login.or': 'ATAU',
  'login.ldapTitle': 'Login LDAP Microsoft',
  'login.ldapSubtitle': 'Masuk dengan kredensial perusahaan Anda',
  'login.ldapUnavailable': 'Saat Ini Tidak Tersedia',
  'login.username': 'Nama Pengguna',
  'login.password': 'Kata Sandi',
  'login.passwordPlaceholder': 'Masukkan kata sandi Anda',
  'login.ldapDomain': 'Domain LDAP: ',
  'login.ldapDomainValue': 'TOYIB.CO.ID',
  'login.ldapAuth': 'Autentikasi via Microsoft Active Directory',
  'login.signInLDAP': 'Masuk dengan LDAP',
  'login.footerAuth': 'Autentikasi aman didukung oleh Google Cloud Platform',
  'login.footerVersion': 'BT-GE v1.0 | Didukung oleh Gemini Enterprise',
  'login.googleNotice': 'Google Sign-In:',
  'login.googleNoticeDesc': 'Gunakan akun Google Anda untuk mengautentikasi dan mengakses Discovery Engine APIs',
  'login.usernameError': 'Nama pengguna harus minimal 6 karakter.',
  'login.passwordError': 'Kata sandi harus minimal 6 karakter.',
  'login.ldapError': 'Autentikasi LDAP gagal. Periksa kredensial Anda.',
  'login.googleError': 'Google Sign-In gagal.',

  'settings.title': 'Pengaturan Portal',
  'settings.desc': 'Konfigurasi preferensi frontend lokal untuk sesi ini.',
  'settings.tabGeneral': 'Umum',
  'settings.tabLocalization': 'Lokalisasi',
  'settings.tabAppearance': 'Tampilan',
  'settings.showReferences': 'Tampilkan Referensi Pengetahuan',
  'settings.showReferencesDesc': 'Tampilkan indikator sumber file dalam pesan chat',
  'settings.language': 'Bahasa',
  'settings.languageDesc': 'Pilih bahasa antarmuka',
  'settings.done': 'Selesai',
  'settings.locSearchPlaceholder': 'Cari terjemahan...',
  'settings.locEnglish': 'Inggris',
  'settings.locIndonesian': 'Indonesia',
  'settings.locResetAll': 'Reset Semua ke Default',
  'settings.colorPresets': 'Preset Warna',
  'settings.colorCustom': 'Warna Kustom',
  'settings.colorPrimary': 'Primer',
  'settings.colorAccent': 'Aksen',
  'settings.colorError': 'Error',
  'settings.colorReset': 'Reset ke Default',

  'common.loading': 'Memuat...',
  'common.yesterday': 'Kemarin',
  'common.noMessages': 'Belum ada pesan',
  'common.noResponse': 'Tidak ada respons diterima.',
  'common.errorFallback': 'Gagal mendapatkan respons. Silakan coba lagi.',
  'common.cancel': 'Batal',
  'common.submit': 'Kirim',

  'footer.version': 'BT-GE v1.0',
  'footer.powered': 'Didukung oleh Gemini Enterprise',
  'footer.brand': 'BT-GE',
  'footer.tagline': 'Asisten Gemini Enterprise',
};

// ── Types ──────────────────────────────────────
type Locale = 'en' | 'id';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  allKeys: string[];
  getEnglish: (key: string) => string;
  getIndonesian: (key: string) => string;
  updateTranslation: (key: string, value: string) => void;
  resetTranslations: () => void;
  customTranslations: Record<string, string>;
}

const I18nContext = createContext<I18nContextType | null>(null);

// ── Provider ──────────────────────────────────
const LOCALE_KEY = 'btge-locale';
const CUSTOM_TRANSLATIONS_KEY = 'btge-custom-translations';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem(LOCALE_KEY) as Locale) || 'en';
  });

  const [customTranslations, setCustomTranslations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TRANSLATIONS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_TRANSLATIONS_KEY, JSON.stringify(customTranslations));
  }, [customTranslations]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback((key: string, vars?: Record<string, string>): string => {
    let value: string;
    if (locale === 'id') {
      value = customTranslations[key] ?? id[key] ?? en[key] ?? key;
    } else {
      value = en[key] ?? key;
    }
    // Replace {{var}} placeholders
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
    }
    return value;
  }, [locale, customTranslations]);

  const getEnglish = useCallback((key: string) => en[key] ?? key, []);
  const getIndonesian = useCallback((key: string) => customTranslations[key] ?? id[key] ?? '', [customTranslations]);

  const updateTranslation = useCallback((key: string, value: string) => {
    setCustomTranslations(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetTranslations = useCallback(() => {
    setCustomTranslations({});
  }, []);

  const allKeys = Object.keys(en);

  return (
    <I18nContext.Provider value={{
      locale, setLocale, t, allKeys, getEnglish, getIndonesian,
      updateTranslation, resetTranslations, customTranslations
    }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
