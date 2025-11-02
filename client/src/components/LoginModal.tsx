import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginModal({ onClose, onShowRegister }: { onClose: () => void; onShowRegister: () => void }) {
  const { loginWithEmail, loginWithPhone } = useAuth();
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'email') {
        await loginWithEmail(form.email, form.password);
      } else {
        await loginWithPhone(form.phone, form.password);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative flex flex-col items-center mx-4" style={{ maxHeight: '90vh', overflowY: 'auto', top: '300px' }}>
        <button type="button" className="absolute top-2 right-2 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        <div className="flex gap-2 mb-4">
          <button type="button" className={`px-3 py-1 rounded ${mode === 'email' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setMode('email')}>Email</button>
          <button type="button" className={`px-3 py-1 rounded ${mode === 'phone' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setMode('phone')}>Phone</button>
        </div>
        {mode === 'email' ? (
          <div className="mb-3 w-full">
            <label className="block mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
        ) : (
          <div className="mb-3 w-full">
            <label className="block mb-1">Phone</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
        )}
        <div className="mb-3 w-full">
          <label className="block mb-1">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded mt-2" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="flex justify-between mt-4 text-sm w-full">
          <button type="button" className="text-primary underline" onClick={onShowRegister}>Create Account</button>
          <button type="button" className="text-primary underline" onClick={() => alert('Forgot password flow coming soon!')}>Forgot Password?</button>
        </div>
      </form>
    </div>
  );
}
