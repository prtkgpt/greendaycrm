interface StatusBadgeProps {
  status: string;
  type?: 'job' | 'invoice';
}

const jobColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const invoiceColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function StatusBadge({ status, type = 'job' }: StatusBadgeProps) {
  const colors = type === 'invoice' ? invoiceColors : jobColors;
  const colorClass = colors[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
