import { appsApi } from './appsApi';
import { authApi } from './authApi';
import { clearAuthToken, getAuthToken, setAuthToken } from './apiClient';
import { eventsApi } from './eventsApi';
import { sessionsApi } from './sessionsApi';
import { settingsApi } from './settingsApi';
import { walletApi } from './walletApi';

export { ApiError, apiRequest, clearAuthToken, getApiErrorMessage, getAuthToken, isApiError, setAuthToken } from './apiClient';
export type { ApiRequestOptions } from './apiClient';
export type { AuthChallenge, AuthVerifyPayload, AuthVerifyResponse } from './authApi';
export type { AppApiKey, AppApiKeyScope, AppChargeAttempt, AutomationInvoice, AutomationPaymentBatch, AutomationPaymentJob, AutomationRecipient, CreateAutomationInvoiceBatchPayload, CreateAutomationInvoicePayload, CreateAutomationRecipientPayload, WebhookDelivery, CreatedAppApiKey, DeveloperApp } from './appsApi';
export type { CreateSessionPayload, CreateSessionPolicy, SessionsOverview, VerifiedApp } from './sessionsApi';
export type { ApiMeta } from './settingsApi';
export type { WalletFundingConfig, WalletFundingOverview, WalletFundingRequest } from './walletApi';

export const fiberPassApi = {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  ...authApi,
  logout: () => authApi.logout().finally(clearAuthToken),
  ...appsApi,
  ...sessionsApi,
  ...settingsApi,
  ...walletApi,
  ...eventsApi
};
