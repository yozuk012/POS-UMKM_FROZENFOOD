"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Tunggu sampai status loading selesai
    if (!loading) {
      if (user) {
        // Jika ada user (sudah login), lempar ke dashboard
        router.replace("/dashboard");
      } else {
        // Jika tidak ada user, lempar ke halaman login
        router.replace("/auth/login");
      }
    }
  }, [user, loading, router]);

  // Tampilkan loading spinner sementara proses redirect berlangsung
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Memuat aplikasi...</p>
      </div>
    </div>
  );
}