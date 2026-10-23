'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdminUser, saveLocalAdminSession } from '@/lib/admin/auth.ts';
import { Scissors, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await loginAdminUser(email, password);
      if (result.success && result.session) {
        saveLocalAdminSession(result.session);
        router.push('/dashboard');
      } else {
        setErrorMsg(result.error || 'Alamat email atau kata sandi admin tidak cocok.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('damez123');
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await loginAdminUser(demoEmail, 'damez123');
      if (result.success && result.session) {
        saveLocalAdminSession(result.session);
        router.push('/dashboard');
      } else {
        setErrorMsg(result.error || 'Gagal masuk akun demo.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-b from-[#242424] to-[#1A1A1A] p-8 text-center border-b border-[#2E2E2E]">
          <div className="size-14 mx-auto mb-3 rounded-xl bg-[#D97706] text-[#121212] flex items-center justify-center shadow-lg shadow-[#D97706]/20">
            <Scissors className="size-8" />
          </div>
          <h2 className="font-display font-bold text-2xl tracking-wide text-[#F5F5F0]">
            DAMEZ BARBERSHOP
          </h2>
          <p className="text-xs text-[#A8A29E] mt-1">
            Portal Administrasi, Kalender Meja & Kasir Gerai
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1.5">
                Alamat Email Admin
              </label>
              <div className="relative">
                <Mail className="size-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@damezbarbershop.com"
                  className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#D97706] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#F5F5F0] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="size-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#D97706] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#F5F5F0] outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 px-4 bg-[#D97706] hover:bg-[#F59E0B] text-[#121212] font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D97706]/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Akses Cepat 1-Klik Demo Mode */}
          <div className="pt-4 border-t border-[#2E2E2E] flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider text-center">
              Akses Cepat Pengujian (1-Klik Demo)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@damezbarbershop.com')}
                className="w-full py-2 px-3 bg-[#242424] hover:bg-[#2C2C2C] text-left rounded-lg border border-[#2E2E2E] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#D97706]" />
                  <span className="text-xs font-semibold text-[#F5F5F0]">
                    👑 Owner &amp; Head Admin
                  </span>
                </div>
                <span className="text-[10px] text-[#A8A29E] font-mono">admin@...</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('kasir@damezbarbershop.com')}
                className="w-full py-2 px-3 bg-[#242424] hover:bg-[#2C2C2C] text-left rounded-lg border border-[#2E2E2E] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-[#10B981]" />
                  <span className="text-xs font-semibold text-[#F5F5F0]">
                    💼 Staf Kasir / Front Desk
                  </span>
                </div>
                <span className="text-[10px] text-[#A8A29E] font-mono">kasir@...</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('barber@damezbarbershop.com')}
                className="w-full py-2 px-3 bg-[#242424] hover:bg-[#2C2C2C] text-left rounded-lg border border-[#2E2E2E] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Scissors className="size-4 text-[#60A5FA]" />
                  <span className="text-xs font-semibold text-[#F5F5F0]">
                    ✂️ Master Barber (Rian)
                  </span>
                </div>
                <span className="text-[10px] text-[#A8A29E] font-mono">barber@...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
