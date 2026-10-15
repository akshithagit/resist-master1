/**
 * Resist - User & Auth0 Authentication Schemas
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  authProvider: 'auth0' | 'local' | 'demo';
  createdAt: string;
  lastLoginAt: string;
}

export interface UserSession {
  user: UserProfile;
  token: string;
  expiresAt: string;
}

export interface Auth0Config {
  domain: string;
  clientId: string;
}
