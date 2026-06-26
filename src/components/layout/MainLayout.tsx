import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/i18n';
import { useTheme } from '../../context/theme';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { X, Sliders, RotateCcw, Search } from 'lucide-react';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

type SettingsTab = 'general' | 'localization' | 'appearance';

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useApp();
  const { t, locale, setLocale, allKeys, getEnglish, getIndonesian, updateTranslation, resetTranslations } = useI18n();
  const { colors, activePreset, presets, applyPreset, setColor, resetColors } = useTheme();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [showReferences, setShowReferences] = useState(true);
  const [locSearch, setLocSearch] = useState('');

  if (!user) {
    return <>{children}</>;
  }

  // Filter translation keys by search
  const filteredKeys = useMemo(() => {
    if (!locSearch.trim()) return allKeys;
    const q = locSearch.toLowerCase();
    return allKeys.filter(key =>
      key.toLowerCase().includes(q) ||
      getEnglish(key).toLowerCase().includes(q) ||
      getIndonesian(key).toLowerCase().includes(q)
    );
  }, [locSearch, allKeys, getEnglish, getIndonesian]);

  return (
    <div className="app-layout">
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="app-main">
        <Header />
        <main className="app-content-panel">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay flex-center animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header flex-between">
              <div className="modal-title-group flex-center">
                <Sliders className="modal-icon" />
                <h3>{t('settings.title')}</h3>
              </div>
              <button className="close-btn flex-center" onClick={() => setIsSettingsOpen(false)}>
                <X className="close-icon" />
              </button>
            </div>

            {/* Tabs */}
            <div className="settings-tabs">
              <button
                className={`settings-tab ${settingsTab === 'general' ? 'active' : ''}`}
                onClick={() => setSettingsTab('general')}
              >
                {t('settings.tabGeneral')}
              </button>
              <button
                className={`settings-tab ${settingsTab === 'localization' ? 'active' : ''}`}
                onClick={() => setSettingsTab('localization')}
              >
                {t('settings.tabLocalization')}
              </button>
              <button
                className={`settings-tab ${settingsTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setSettingsTab('appearance')}
              >
                {t('settings.tabAppearance')}
              </button>
            </div>

            {/* Tab Content */}
            <div className="settings-body">

              {/* ── General Tab ──────────────────────── */}
              {settingsTab === 'general' && (
                <div className="settings-tab-content">
                  <p className="settings-section-desc">{t('settings.desc')}</p>

                  <div className="settings-option checkbox-option">
                    <div className="option-label-group">
                      <span className="option-title">{t('settings.showReferences')}</span>
                      <span className="option-sub">{t('settings.showReferencesDesc')}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showReferences}
                      onChange={(e) => setShowReferences(e.target.checked)}
                      className="settings-checkbox"
                    />
                  </div>

                  <div className="settings-option">
                    <div className="option-label-group">
                      <span className="option-title">{t('settings.language')}</span>
                      <span className="option-sub">{t('settings.languageDesc')}</span>
                    </div>
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as 'en' | 'id')}
                      className="settings-select"
                    >
                      <option value="en">English</option>
                      <option value="id">Bahasa Indonesia</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── Localization Tab ─────────────────── */}
              {settingsTab === 'localization' && (
                <div className="settings-tab-content">
                  <div className="loc-header">
                    <div className="loc-search-bar">
                      <Search className="loc-search-icon" />
                      <input
                        type="text"
                        placeholder={t('settings.locSearchPlaceholder')}
                        value={locSearch}
                        onChange={(e) => setLocSearch(e.target.value)}
                        className="loc-search-input"
                      />
                    </div>
                    <button className="btn-text" onClick={resetTranslations}>
                      <RotateCcw className="btn-text-icon" />
                      {t('settings.locResetAll')}
                    </button>
                  </div>

                  <div className="loc-table-wrapper">
                    <table className="loc-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>{t('settings.locEnglish')}</th>
                          <th>{t('settings.locIndonesian')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredKeys.map(key => (
                          <tr key={key}>
                            <td className="loc-key">{key}</td>
                            <td className="loc-en">{getEnglish(key)}</td>
                            <td className="loc-id">
                              <input
                                type="text"
                                value={getIndonesian(key)}
                                onChange={(e) => updateTranslation(key, e.target.value)}
                                className="loc-edit-input"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Appearance Tab ───────────────────── */}
              {settingsTab === 'appearance' && (
                <div className="settings-tab-content">
                  <div className="appearance-section">
                    <h4 className="appearance-heading">{t('settings.colorPresets')}</h4>
                    <div className="preset-grid">
                      {presets.map(preset => (
                        <button
                          key={preset.name}
                          className={`preset-card ${activePreset === preset.name ? 'active' : ''}`}
                          onClick={() => applyPreset(preset.name)}
                        >
                          <div className="preset-swatches">
                            <span className="preset-dot" style={{ background: preset.primary }} />
                            <span className="preset-dot" style={{ background: preset.accent }} />
                            <span className="preset-dot" style={{ background: preset.error }} />
                          </div>
                          <span className="preset-label">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="appearance-section">
                    <h4 className="appearance-heading">{t('settings.colorCustom')}</h4>
                    <div className="color-pickers">
                      <div className="color-picker-row">
                        <label>{t('settings.colorPrimary')}</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={colors.primary}
                            onChange={(e) => setColor('primary', e.target.value)}
                            className="color-input"
                          />
                          <span className="color-hex">{colors.primary}</span>
                        </div>
                      </div>
                      <div className="color-picker-row">
                        <label>{t('settings.colorAccent')}</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={colors.accent}
                            onChange={(e) => setColor('accent', e.target.value)}
                            className="color-input"
                          />
                          <span className="color-hex">{colors.accent}</span>
                        </div>
                      </div>
                      <div className="color-picker-row">
                        <label>{t('settings.colorError')}</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={colors.error}
                            onChange={(e) => setColor('error', e.target.value)}
                            className="color-input"
                          />
                          <span className="color-hex">{colors.error}</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-text" onClick={resetColors} style={{ marginTop: 'var(--space-md)' }}>
                      <RotateCcw className="btn-text-icon" />
                      {t('settings.colorReset')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="settings-footer">
              <button type="button" className="btn-primary" onClick={() => setIsSettingsOpen(false)}>
                {t('settings.done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
