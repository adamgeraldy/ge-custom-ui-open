// Type declarations for Google Identity Services (GIS) library
// Reference: https://developers.google.com/identity/oauth2/web/reference/js-reference

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
        error_description?: string;
        error_uri?: string;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string; message: string }) => void;
        prompt?: '' | 'none' | 'consent' | 'select_account';
        hint?: string;
        hosted_domain?: string;
        state?: string;
      }

      interface TokenClient {
        requestAccessToken(overrideConfig?: {
          prompt?: string;
          hint?: string;
          state?: string;
          scope?: string;
        }): void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
      function hasGrantedAllScopes(
        tokenResponse: TokenResponse,
        ...scopes: string[]
      ): boolean;
      function revoke(accessToken: string, callback?: () => void): void;
    }

    namespace id {
      interface CredentialResponse {
        credential: string;
        select_by: string;
      }

      interface GsiButtonConfiguration {
        type: 'standard' | 'icon';
        theme?: 'outline' | 'filled_blue' | 'filled_black';
        size?: 'large' | 'medium' | 'small';
        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
        shape?: 'rectangular' | 'pill' | 'circle' | 'square';
        logo_alignment?: 'left' | 'center';
        width?: number;
        locale?: string;
      }

      function initialize(config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }): void;

      function renderButton(
        parent: HTMLElement,
        options: GsiButtonConfiguration
      ): void;

      function prompt(): void;
      function disableAutoSelect(): void;
    }
  }
}
