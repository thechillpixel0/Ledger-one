import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Business, Employee } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  employee: Employee | null;
  loading: boolean;
  isOwner: boolean;
  isEmployee: boolean;
  signOut: () => Promise<void>;
  loginEmployee: (businessId: string, employeeId: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        setBusiness(businessData);
        setEmployee(null);
      } else {
        setUser(null);
        setBusiness(null);
        setEmployee(null);
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setBusiness(null);
          setEmployee(null);
          setLoading(false);
        } else if (session?.user) {
          await refreshAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setBusiness(null);
    setEmployee(null);
    setLoading(false);
  };

  const loginEmployee = async (businessId: string, employeeId: string, passcode: string) => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('business_id', businessId)
        .eq('passcode', passcode)
        .eq('is_active', true)
        .single();

      if (employeeData) {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        setUser(null);
        setBusiness(businessData);
        setEmployee(employeeData);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials or inactive employee' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please check your credentials.' };
    }
  };

  const value = {
    user,
    business,
    employee,
    loading,
    isOwner: !!user && !!business,
    isEmployee: !!employee && !user,
    signOut,
    loginEmployee,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}