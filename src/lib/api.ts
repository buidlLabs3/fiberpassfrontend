import { appsApi } from './appsApi';
import { authApi } from './authApi';
import { clearAuthToken, getAuthToken, setAuthToken } from './apiClient';
import { eventsApi } from './eventsApi';
import { sessionsApi } from './sessionsApi';

export { ApiError, apiRequest, clearAuthToken, getApiErrorMessage, getAuthToken, isApiError, setAuthToken } from './apiClient';
export type { ApiRequestOptions } from './apiClient';
export type { AuthChallenge, AuthVerifyPayload, AuthVerifyResponse } from './authApi';
export type { AppApiKey, AppChargeAttempt, CreatedAppApiKey, DeveloperApp } from './appsApi';
export type { CreateSessionPayload, CreateSessionPolicy, SessionsOverview, VerifiedApp } from './sessionsApi';

export const fiberPassApi = {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  ...authApi,
  logout: () => authApi.logout().finally(clearAuthToken),
  ...appsApi,
  ...sessionsApi,
  ...eventsApi
};
