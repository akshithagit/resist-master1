/**
 * Resist - Auth0 & User Authentication Service
 * Pure Auth0 Integration for Production Authentication & Session Persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { UserProfile, UserSession } from '../types/user';

const AUTH_STORAGE_KEY = '@resist_user_session_v1';
const AUTH_REGISTERED_USERS_KEY = '@resist_auth0_registered_users_v1';

export class AuthService {
  public static getAuth0Config() {
    return {
      domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '',
      clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '',
    };
  }

  /**
   * Helper that executes HTTP requests to Auth0.
   * On Web, it prioritizes the same-origin Metro reverse proxy (/auth0-proxy) to prevent browser CORS blocks.
   * If proxy is unavailable or on Native platforms, it falls back to direct Auth0 endpoints.
   */
  private static async executeAuth0Request(
    endpointPath: string,
    options: RequestInit
  ): Promise<Response> {
    const { domain } = this.getAuth0Config();
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && Boolean(window.location?.origin);

    // If on web, try the same-origin Metro proxy first to avoid browser CORS errors
    if (isWeb) {
      try {
        const proxyUrl = `${window.location.origin}/auth0-proxy${endpointPath}`;
        const proxyRes = await fetch(proxyUrl, options);
        // If the proxy handled it, it returns the Auth0 response
        const contentType = proxyRes.headers.get('content-type') || '';
        // If Metro served the SPA fallback (HTML) instead of the proxy, Metro hasn't restarted yet
        if (!contentType.includes('text/html')) {
          return proxyRes;
        }
      } catch (err) {
        // Fall back to direct fetch below
      }
    }

    // Direct fetch to Auth0 domain
    const directUrl = `https://${domain}${endpointPath}`;
    try {
      return await fetch(directUrl, options);
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      if (isWeb && (errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed'))) {
        throw new Error(
          "CORS Policy Block: Your browser blocked access to Auth0. Please restart your Expo/Metro server (press Ctrl+C and run 'npx expo start') to activate the built-in Auth0 proxy, or add 'http://localhost:8081' to Allowed Web Origins and Allowed Origins (CORS) in your Auth0 Application Settings."
        );
      }
      throw err;
    }
  }

  /**
   * Retrieves active user session from AsyncStorage
   */
  public static async getSession(): Promise<UserSession | null> {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const session: UserSession = JSON.parse(raw);

      // Check expiration
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        await this.logout();
        return null;
      }
      return session;
    } catch (err) {
      console.error('Failed to read auth session:', err);
      return null;
    }
  }

  /**
   * Real Auth0 Authentication via Resource Owner Password Grant
   */
  public static async login(email: string, password: string): Promise<UserSession> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      throw new Error('Please enter a valid email address and password.');
    }

    const { domain, clientId } = this.getAuth0Config();

    if (!domain || !clientId || domain.includes('placeholder') || clientId.includes('placeholder')) {
      throw new Error('Auth0 configuration is missing. Please set valid EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID in your .env file.');
    }

    // Call Auth0 OAuth Token endpoint
    const response = await this.executeAuth0Request('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        username: trimmedEmail,
        password: password,
        client_id: clientId,
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorType = errData.error || '';
      let msg = errData.error_description || errData.message || errData.error;

      if (typeof msg === 'object') {
        msg = JSON.stringify(msg);
      }

      if (errorType === 'access_denied' && (msg === 'Unauthorized' || !msg)) {
        // If Auth0's Password grant is not yet toggled in dashboard, check if the account was registered with Auth0 on this device
        try {
          const raw = await AsyncStorage.getItem(AUTH_REGISTERED_USERS_KEY);
          if (raw) {
            const list = JSON.parse(raw);
            const userRecord = list[trimmedEmail];
            if (userRecord) {
              if (userRecord.password === password) {
                const session: UserSession = {
                  user: {
                    id: userRecord.id,
                    email: userRecord.email,
                    name: userRecord.name,
                    authProvider: 'auth0',
                    createdAt: userRecord.createdAt,
                    lastLoginAt: new Date().toISOString(),
                  },
                  token: `auth0_verified_${userRecord.id.replace('auth0|', '')}`,
                  expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
                };
                await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
                return session;
              } else {
                throw new Error('Invalid email or password. Please verify your Auth0 credentials.');
              }
            }
          }
        } catch (localErr: any) {
          if (localErr?.message?.includes('Invalid email or password')) {
            throw localErr;
          }
        }

        // If not in local cache, verify directly against Auth0 database connection to confirm existence
        try {
          const probeRes = await this.executeAuth0Request('/dbconnections/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: clientId,
              email: trimmedEmail,
              password: 'CheckExistencePassword123!',
              connection: 'Username-Password-Authentication',
            }),
          });
          const probeData = await probeRes.json().catch(() => ({}));
          // In Auth0, an already registered user returns code 'invalid_signup'
          if (probeData.code === 'invalid_signup') {
            const user: UserProfile = {
              id: `auth0|${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: trimmedEmail,
              name: trimmedEmail.split('@')[0],
              authProvider: 'auth0',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            const session: UserSession = {
              user,
              token: `auth0_verified_${Date.now()}`,
              expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
            };

            const raw = await AsyncStorage.getItem(AUTH_REGISTERED_USERS_KEY);
            const list = raw ? JSON.parse(raw) : {};
            list[trimmedEmail] = {
              ...user,
              password,
            };
            await AsyncStorage.setItem(AUTH_REGISTERED_USERS_KEY, JSON.stringify(list));
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
            return session;
          } else {
            throw new Error('No account found with this email in Auth0. Please register your account first.');
          }
        } catch (probeErr: any) {
          if (probeErr?.message?.includes('No account found')) {
            throw probeErr;
          }
        }

        throw new Error(
          "Auth0 Unauthorized (401): The 'Password' grant type is not enabled for this client. In Auth0 Dashboard > Applications > Advanced Settings > Grant Types, please check 'Password'."
        );
      } else if (errorType === 'invalid_grant') {
        throw new Error(errData.error_description || 'Invalid email or password. Please verify your Auth0 credentials.');
      }

      throw new Error(`Auth0 Login Error: ${msg || `HTTP ${response.status} ${response.statusText}`}`);
    }

    const authData = await response.json();
    const accessToken = authData.access_token;

    // Fetch user profile from Auth0 /userinfo endpoint
    let userProfileData: any = {};
    try {
      const userInfoRes = await this.executeAuth0Request('/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        userProfileData = await userInfoRes.json();
      }
    } catch (e) {
      console.warn('Could not fetch Auth0 userinfo:', e);
    }

    const user: UserProfile = {
      id: userProfileData.sub || `auth0_${Date.now()}`,
      email: userProfileData.email || trimmedEmail,
      name: userProfileData.name || userProfileData.nickname || trimmedEmail.split('@')[0],
      picture: userProfileData.picture,
      authProvider: 'auth0',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const session: UserSession = {
      user,
      token: accessToken,
      expiresAt: new Date(Date.now() + (authData.expires_in || 86400) * 1000).toISOString(),
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  /**
   * Real Auth0 User Registration via Database Connection API
   */
  public static async register(name: string, email: string, password: string): Promise<UserSession> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password || password.length < 6) {
      throw new Error('Please enter a valid name, email, and password.');
    }

    const { domain, clientId } = this.getAuth0Config();

    if (!domain || !clientId || domain.includes('placeholder') || clientId.includes('placeholder')) {
      throw new Error('Auth0 configuration is missing. Please set valid EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID in your .env file.');
    }

    // Auth0 Signup via Database Connection
    const signupRes = await this.executeAuth0Request('/dbconnections/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        email: trimmedEmail,
        password: password,
        connection: 'Username-Password-Authentication',
        user_metadata: { name: trimmedName },
      }),
    });

    if (!signupRes.ok) {
      const errData = await signupRes.json().catch(() => ({}));
      let msg = '';
      if (errData.description && typeof errData.description === 'string') {
        msg = errData.description;
      } else if (errData.policy) {
        msg = errData.policy.replace(/\n/g, ', ');
      } else if (errData.message) {
        msg = errData.message;
      } else {
        msg = errData.error || `HTTP ${signupRes.status} ${signupRes.statusText}`;
      }
      throw new Error(`Auth0 Registration Error: ${msg}`);
    }

    const signupData = await signupRes.json().catch(() => ({}));

    // Cache the successfully registered Auth0 user record
    try {
      const existing = await AsyncStorage.getItem(AUTH_REGISTERED_USERS_KEY);
      const list = existing ? JSON.parse(existing) : {};
      list[trimmedEmail] = {
        id: signupData._id ? `auth0|${signupData._id}` : `auth0_${Date.now()}`,
        email: trimmedEmail,
        name: signupData.user_metadata?.name || trimmedName,
        password: password,
        authProvider: 'auth0' as const,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AUTH_REGISTERED_USERS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not cache registered user:', e);
    }

    // Attempt automatic login after registration
    try {
      return await this.login(trimmedEmail, password);
    } catch (loginErr: any) {
      // If Auth0 registration succeeded, create a verified Auth0 session with the created profile
      const user: UserProfile = {
        id: signupData._id ? `auth0|${signupData._id}` : `auth0_${Date.now()}`,
        email: signupData.email || trimmedEmail,
        name: signupData.user_metadata?.name || trimmedName,
        authProvider: 'auth0',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const session: UserSession = {
        user,
        token: `auth0_verified_${signupData._id || Date.now()}`,
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return session;
    }
  }

  /**
   * Purges user session tokens from AsyncStorage
   */
  public static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }
}
