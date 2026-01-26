export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_size: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_jobs?: number;
  completed_jobs?: number;
  jobs?: Job[];
  invoices?: Invoice[];
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  service_id: string | null;
  title: string;
  description: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string | null;
  scheduled_time: string | null;
  completed_date: string | null;
  price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  service_name?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  job_id: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  job_title?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  jobsToday: number;
  jobsThisWeek: number;
  pendingJobs: number;
  completedThisMonth: number;
  revenueThisMonth: number;
  pendingInvoicesTotal: number;
  pendingInvoicesCount: number;
}

export interface Activity {
  type: 'job' | 'invoice';
  id: string;
  description: string;
  status: string;
  timestamp: string;
  customer_name: string;
}
