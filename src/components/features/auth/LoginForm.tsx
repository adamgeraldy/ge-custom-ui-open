import React, { useState } from 'react';
import { useI18n } from '../../../context/i18n';
import { useApp } from '../../../context/AppContext';
import { Shield, User, Lock, Server, Terminal } from 'lucide-react';
import { requestGoogleAccessToken } from '../../../utils/google-auth';
import './LoginForm.css';

export const LoginForm: React.FC = () => {
  const { t } = useI18n();
  const { login, loginWithGoogle, googleClientId } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 6) {
      setError(t('login.usernameError'));
      return;
    }

    if (password.trim().length < 6) {
      setError(t('login.passwordError'));
      return;
    }

    setIsLoading(true);
    
    // Simulate LDAP network authentication delay
    setTimeout(() => {
      const success = login(username);
      setIsLoading(false);
      if (!success) {
        setError(t('login.ldapError'));
      }
    }, 1200);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const result = await requestGoogleAccessToken(googleClientId);
      loginWithGoogle(result.accessToken, result.expiresIn, result.userInfo);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('login.googleError');
      // Don't show error if user simply closed the popup
      if (!message.includes('popup_closed') && !message.includes('access_denied')) {
        setError(message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // LDAP fields are disabled — Google is the primary sign-in method
  const isLdapDisabled = true;

  return (
    <div className="login-container">
      <div className="login-backdrop"></div>
      
      <div className="login-content animate-slide-up">
        {/* Brand Logo Header */}
        <div className="brand-header flex-center">
          <div className="brand-logo-card flex-center">
            <img src="/mascot.png" alt="BT-GE" className="brand-logo" />
          </div>
        </div>

        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>

        {/* Login Form Card */}
        <div className="login-card">
          {/* Google Sign-In Button — Primary Action */}
          <div className="google-signin-section">
            <button
              type="button"
              id="google-signin-button"
              className={`google-signin-button ${isGoogleLoading ? 'loading' : ''}`}
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <div className="spinner google-spinner"></div>
              ) : (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t('login.signInGoogle')}
                </>
              )}
            </button>
            <p className="google-signin-hint">{t('login.googleHint')}</p>
          </div>

          {/* Divider */}
          <div className="login-divider">
            <span className="divider-line"></span>
            <span className="divider-text">{t('login.or')}</span>
            <span className="divider-line"></span>
          </div>

          {/* LDAP Section — Disabled */}
          <div className={`ldap-section ${isLdapDisabled ? 'ldap-disabled' : ''}`}>
            <div className="card-header">
              <div className="header-icon-container">
                <Shield className="header-icon" />
              </div>
              <div className="header-text">
                <h2>{t('login.ldapTitle')}</h2>
                <p>{t('login.ldapSubtitle')}</p>
                {isLdapDisabled && (
                  <span className="ldap-disabled-badge">{t('login.ldapUnavailable')}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card-form">
              {error && <div className="form-error-banner">{error}</div>}

              <div className="input-group">
                <label htmlFor="username">{t('login.username')}</label>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    placeholder={t('login.username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLdapDisabled || isLoading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">{t('login.password')}</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLdapDisabled || isLoading}
                  />
                </div>
              </div>

              {/* LDAP Domain Display */}
              <div className="ldap-domain-badge">
                <Server className="badge-icon" />
                <div className="badge-text">
                  <span className="badge-title">{t('login.ldapDomain')}</span>
                  <span className="badge-value">{t('login.ldapDomainValue')}</span>
                  <p className="badge-desc">{t('login.ldapAuth')}</p>
                </div>
              </div>

              <button
                type="submit"
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLdapDisabled || isLoading}
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <Terminal className="button-icon" />
                    {t('login.signInLDAP')}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="card-footer">
            {t('login.footerAuth')}
            <br />
            {t('login.footerVersion')}
          </div>
        </div>

        {/* Info Notice */}
        <div className="demo-notice">
          <strong>{t('login.googleNotice')}</strong> {t('login.googleNoticeDesc')}
        </div>
      </div>
    </div>
  );
};
