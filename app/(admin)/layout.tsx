'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocalAdminSession, clearLocalAdminSession, type AdminUser } from '@/lib/admin/auth.ts';
import { AdminHeader } from '@/components/admin/AdminHeader.tsx';
import { QuickWalkInModal } from '@/components/admin/QuickWalkInModal.tsx';
import { getJakartaDateString } from '@/lib/utils/timezone.ts';

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(getJakartaDateString());
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Bypass auth guard if currently on login page
    if (pathname.includes('/login')) {
      return;
    }

    const session = getLocalAdminSession();
    if (!session) {
      // Default fallback demo user for seamless offline experience or redirect to login
      const defaultDemoUser: AdminUser = {
        id: 'usr-admin-001',
        email: 'admin@damezbarbershop.com',
        role: 'owner',
        name: 'Damez (Owner & Admin)'
      };
      setUser(defaultDemoUser);
    } else {
      setUser(session.user);
    }

    // Keyboard shortcut listener: Alt + W for Quick Walk-In Modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setIsWalkInOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  const handleLogout = async () => {
    await clearLocalAdminSession();
    setUser(null);
    router.push('/login');
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    // Dispatche vent to update components
    window.dispatchEvent(new CustomEvent('damez:date_change', { detail: { date: newDate } }));
  };

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(`/api/admin/reports/daily-csv?date=${currentDate}`);
      if (!res.ok) throw new Error('Gagal mengunduh CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-damez-${currentDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Direct client fallback
      window.location.href = `/api/admin/reports/daily-csv?date=${currentDate}`;
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    window.dispatchEvent(new CustomEvent('damez:refresh_data'));
    setTimeout(() => setLoading(false), 600);
  };

  // If on login page, render children directly without Admin Header
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F0] flex flex-col">
      <AdminHeader
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onOpenWalkIn={() => setIsWalkInOpen(true)}
        onDownloadCsv={handleDownloadCsv}
        onRefresh={handleRefresh}
        user={user}
        onLogout={handleLogout}
        loading={loading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {children}
      </main>

      {/* Global Quick Walk-in Modal accessible from Alt+W or Top Header */}
      <QuickWalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onSubmit={async (params) => {
          try {
            const res = await fetch('/api/admin/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params)
            });
            const data = await res.json();
            if (data.success) {
              handleRefresh();
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}
