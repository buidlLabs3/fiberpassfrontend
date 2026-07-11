import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import RecipientClaimView from './components/RecipientClaimView.tsx';
import './index.css';

const claimMatch = window.location.pathname.match(/^\/recipient-claim\/([^/]+)$/);
const rootComponent = claimMatch ? <RecipientClaimView token={decodeURIComponent(claimMatch[1])} /> : <App />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {rootComponent}
  </StrictMode>,
);
