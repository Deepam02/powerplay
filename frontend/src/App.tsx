import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvoiceList } from './pages/InvoiceList';
import { CustomerProfile } from './pages/CustomerProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<InvoiceList />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
