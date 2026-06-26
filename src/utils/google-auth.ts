/**
 * Google OAuth2 Authentication Helper
 *
 * Uses Google Identity Services (GIS) Token Model (implicit flow) to obtain
 * access tokens for calling Google Cloud APIs like Discovery Engine.
 *
 * The token client is initialized once and reused for token requests.
 * Tokens are stored in localStorage and auto-refreshed before expiry.
 */

const STORAGE_KEY = 'bt_gpt_google_token';
const STORAGE_EXPIRY_KEY = 'bt_gpt_google_token_expiry';
const STORAGE_USER_KEY = 'bt_gpt_google_user';

// Buffer time in ms before actual expiry to trigger refresh (5 minutes)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
}

interface StoredTokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

// Callback for silent refresh — will be set by initGoogleAuth
let onTokenRefreshed: ((token: string, expiresIn: number) => void) | null = null;
let onTokenError: (() => void) | null = null;

/**
 * Initialize the Google OAuth2 token client.
 * Sets up callbacks for auto-refresh. Must be called after the GIS script has loaded.
 */
export function initGoogleAuth(
  _clientId: string,
  callbacks?: {
    onRefreshed?: (token: string, expiresIn: number) => void;
    onError?: () => void;
  }
): void {
  if (callbacks?.onRefreshed) onTokenRefreshed = callbacks.onRefreshed;
  if (callbacks?.onError) onTokenError = callbacks.onError;
}

/**
 * Request an access token via the Google Sign-In popup.
 * Returns a promise that resolves with the token response.
 */
export function requestGoogleAccessToken(
  clientId: string
): Promise<{ accessToken: string; expiresIn: number; userInfo: GoogleUserInfo }> {
  return new Promise((resolve, reject) => {
    // Wait for GIS library to be available
    if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services library not loaded. Please try again.'));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/cloud-platform openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        const accessToken = tokenResponse.access_token;
        const expiresIn = tokenResponse.expires_in;

        // Store the token
        storeToken(accessToken, expiresIn);

        // Fetch user info from Google's userinfo endpoint
        try {
          const userInfo = await fetchUserInfo(accessToken);
          storeUserInfo(userInfo);

          // Schedule auto-refresh
          scheduleTokenRefresh(clientId, expiresIn);

          resolve({ accessToken, expiresIn, userInfo });
        } catch (err) {
          // Token works but userinfo failed — still resolve with defaults
          const fallbackUser: GoogleUserInfo = {
            email: 'user@google.com',
            name: 'Google User',
            picture: '',
          };
          resolve({ accessToken, expiresIn, userInfo: fallbackUser });
        }
      },
      error_callback: (error) => {
        reject(new Error(error.message || 'Google Sign-In was cancelled or failed.'));
      },
    });

    client.requestAccessToken();
  });
}

/**
 * Attempt silent token refresh using the GIS prompt: 'none' option.
 * Falls back to 'consent' if silent refresh fails.
 */
export function silentTokenRefresh(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
      reject(new Error('GIS not loaded'));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/cloud-platform openid email profile',
      prompt: '',  // Empty string = no prompt if user already consented
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        const accessToken = tokenResponse.access_token;
        const expiresIn = tokenResponse.expires_in;

        storeToken(accessToken, expiresIn);
        scheduleTokenRefresh(clientId, expiresIn);

        if (onTokenRefreshed) {
          onTokenRefreshed(accessToken, expiresIn);
        }

        resolve(accessToken);
      },
      error_callback: (error) => {
        reject(new Error(error.message || 'Silent refresh failed'));
      },
    });

    client.requestAccessToken();
  });
}

/**
 * Schedule automatic token refresh before expiry.
 */
function scheduleTokenRefresh(clientId: string, expiresInSeconds: number): void {
  // Clear any existing timer
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }

  // Refresh 5 minutes before expiry, or at half-life if expiry < 10 min
  const expiresInMs = expiresInSeconds * 1000;
  const refreshDelay = expiresInMs > REFRESH_BUFFER_MS * 2
    ? expiresInMs - REFRESH_BUFFER_MS
    : expiresInMs / 2;

  refreshTimerId = setTimeout(async () => {
    try {
      await silentTokenRefresh(clientId);
    } catch {
      // Silent refresh failed — notify the app to redirect to login
      if (onTokenError) {
        onTokenError();
      }
    }
  }, refreshDelay);
}

/**
 * Fetch user info from Google's userinfo endpoint.
 */
async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();
  return {
    email: data.email || '',
    name: data.name || data.email || 'Google User',
    picture: data.picture || '',
  };
}

// ─── Token Storage ───────────────────────────────────────────────

function storeToken(accessToken: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(STORAGE_KEY, accessToken);
  localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));
}

function storeUserInfo(userInfo: GoogleUserInfo): void {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userInfo));
}

export function getStoredToken(): StoredTokenData | null {
  const token = localStorage.getItem(STORAGE_KEY);
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);

  if (!token || !expiry) return null;

  const expiresAt = parseInt(expiry, 10);
  if (isNaN(expiresAt)) return null;

  return { accessToken: token, expiresAt };
}

export function getStoredUserInfo(): GoogleUserInfo | null {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleUserInfo;
  } catch {
    return null;
  }
}

export function isTokenExpired(): boolean {
  const stored = getStoredToken();
  if (!stored) return true;
  return Date.now() >= stored.expiresAt;
}

export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_EXPIRY_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);

  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

/**
 * Revoke the current Google access token.
 */
export function revokeGoogleToken(): void {
  const stored = getStoredToken();
  if (stored && typeof google !== 'undefined' && google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(stored.accessToken, () => {
      clearStoredAuth();
    });
  } else {
    clearStoredAuth();
  }
}
