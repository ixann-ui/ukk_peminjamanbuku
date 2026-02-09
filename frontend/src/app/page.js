'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on user role
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        // Redirect to landing page if not authenticated
        router.push('/landing');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}