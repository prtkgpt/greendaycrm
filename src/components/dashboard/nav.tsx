'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Route,
  FileText,
  BarChart3,
  Settings,
  Leaf,
  Wrench,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Calendar },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/dashboard/routes', label: 'Routes', icon: Route },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/blog', label: 'Blog', icon: Newspaper, adminOnly: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface DashboardNavProps {
  userRole?: string;
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';
  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">GreenDay</h1>
              <p className="text-xs text-gray-500">CRM</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-emerald-600' : 'text-gray-400'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Crew App Link */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/crew"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Wrench className="w-5 h-5 text-gray-400" />
              Crew App
            </Link>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">GreenDay CRM v1.0</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          {filteredNavItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center py-2 px-3 text-xs',
                  isActive ? 'text-emerald-600' : 'text-gray-500'
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
