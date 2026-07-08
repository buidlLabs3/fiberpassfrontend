import { API_URL, getAuthToken } from './apiClient';
import { type SessionsOverview } from './sessionsApi';

export const eventsApi = {
  openSessionEvents: (onOverview: (overview: SessionsOverview) => void, onError: () => void) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Connect with JoyID before opening live updates.');
    }

    const source = new EventSource(API_URL + '/events?token=' + encodeURIComponent(token));
    source.addEventListener('overview', (event) => {
      onOverview(JSON.parse((event as MessageEvent<string>).data) as SessionsOverview);
    });
    source.onerror = onError;
    return source;
  }
};
