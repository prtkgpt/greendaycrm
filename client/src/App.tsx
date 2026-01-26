import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Jobs from './pages/Jobs';
import Invoices from './pages/Invoices';
import Services from './pages/Services';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
