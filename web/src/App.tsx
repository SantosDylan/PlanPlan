import { HashRouter, Route, Routes } from 'react-router';
import CatalogPage from './pages/CatalogPage.js';
import ManageSubscriptionPage from './pages/ManageSubscriptionPage.js';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/gerer" element={<ManageSubscriptionPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
