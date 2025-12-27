import React, { useState } from 'react';
import { Mail, Lock, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface OwnerLoginProps {
  onSwitchToEmployee: () => void;
}

export function OwnerLogin({ onSwitchToEmployee }: OwnerLoginProps) {
  const { error: showError, success: showSuccess } = useNotification();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: businessError } = await supabase
            .from('businesses')
            .insert([
              {
                name: businessName,
                owner_id: authData.user.id,
                settings: { pos_type: 'simple', auto_logout: false },
              },
            ]);

          if (businessError) throw businessError;
          showSuccess('Account Created', 'Your business account has been created successfully!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        showSuccess('Welcome Back', 'You have been logged in successfully!');
      }
    } catch (err: any) {
      showError('Authentication Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LedgerOne</h1>
          <h2 className="text-xl text-gray-600">
            {isSignUp ? 'Create Your Business' : 'Owner Login'}
          </h2>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>

          {isSignUp && (
            <Input
              label="Business Name"
              type="text"
              icon={<Building className="h-5 w-5" />}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            icon={<Mail className="h-5 w-5" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            icon={<Lock className="h-5 w-5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            minLength={6}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {isSignUp ? 'Create Business' : 'Sign In'}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isSignUp ? 'Already have a business? Sign in' : 'Create a new business'}
            </button>
            
            <div>
              <button
                type="button"
                onClick={onSwitchToEmployee}
                className="text-gray-600 hover:text-gray-500 text-sm"
              >
                Employee Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}