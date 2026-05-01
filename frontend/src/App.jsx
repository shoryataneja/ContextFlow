import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ContextList from './pages/ContextList';
import ContextDetail from './pages/ContextDetail';
import AddContext from './pages/AddContext';
import Retrieve from './pages/Retrieve';
import RAGQuery from './pages/RAGQuery';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
        }}
      />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ask" element={<RAGQuery />} />
          <Route path="/contexts" element={<ContextList />} />
          <Route path="/contexts/:id" element={<ContextDetail />} />
          <Route path="/add" element={<AddContext />} />
          <Route path="/retrieve" element={<Retrieve />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
