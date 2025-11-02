import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function RegisterModal({ onClose }: { onClose: () => void }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(form);
      setSuccess('Registration successful! You are now logged in.');
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 p-2 sm:p-0">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative flex flex-col items-center mx-auto" style={{ maxHeight: '90vh', overflowY: 'auto', top: '300px' }}>
        <button type="button" className="absolute top-2 right-2 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-semibold mb-4">Create Account</h2>
        <div className="mb-3 w-full">
          <label className="block mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3 w-full">
          <label className="block mb-1">Email (optional)</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3 w-full">
          <label className="block mb-1">Phone (optional)</label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3 w-full">
          <label className="block mb-1">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded mt-2" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
