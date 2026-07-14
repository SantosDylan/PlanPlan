import { ToastProvider } from './context/ToastContext.js';
import CatalogPage from './pages/CatalogPage.js';

function App() {
  return (
    <ToastProvider>
      <CatalogPage />
    </ToastProvider>
  );
}

export default App;
