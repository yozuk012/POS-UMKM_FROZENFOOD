// src/app/test-connection/page.js
'use client';

import { useEffect, useState } from 'react';
import { supabase, testConnection } from '@/lib/supabase';

export default function TestConnectionPage() {
  const [status, setStatus] = useState('testing');
  const [message, setMessage] = useState('Testing connection...');
  const [authStatus, setAuthStatus] = useState('checking');

  useEffect(() => {
    // Test 1: Koneksi Database
    const runTest = async () => {
      const result = await testConnection();
      
      if (result.success) {
        setStatus('success');
        setMessage('✅ Koneksi ke Supabase BERHASIL! Database terhubung.');
      } else {
        setStatus('error');
        setMessage(`❌ Koneksi GAGAL: ${result.error}`);
      }
    };

    // Test 2: Cek Auth Session
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthStatus('error');
      } else if (session) {
        setAuthStatus('logged-in');
      } else {
        setAuthStatus('not-logged-in');
      }
    };

    runTest();
    checkAuth();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1> Supabase Connection Test</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Database Connection</h2>
        <p>Status: <strong>{status}</strong></p>
        <p>{message}</p>
      </div>

      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Authentication Status</h2>
        <p>
          {authStatus === 'checking' && ' Checking auth session...'}
          {authStatus === 'logged-in' && '✅ User is logged in'}
          {authStatus === 'not-logged-in' && 'ℹ️ No active session (normal for first visit)'}
          {authStatus === 'error' && '❌ Auth error occurred'}
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Environment Variables Check:</h3>
        <p>
          SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
        </p>
        <p>
          SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
        </p>
      </div>
    </div>
  );
}