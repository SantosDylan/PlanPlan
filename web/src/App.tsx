import { HashRouter, Route, Routes } from 'react-router';
import { MovieSelectionProvider } from './context/MovieSelectionContext.js';
import { ToastProvider } from './context/ToastContext.js';
import CatalogPage from './pages/CatalogPage.js';
import ManageSubscriptionPage from './pages/ManageSubscriptionPage.js';

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <MovieSelectionProvider>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/gerer" element={<ManageSubscriptionPage />} />
          </Routes>
        </MovieSelectionProvider>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
