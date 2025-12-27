import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Business, Employee } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  business: Business | null;
  employee: Employee | null;
  loading: boolean;
  isOwner: boolean;
  isEmployee: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    business: null,
    employee: null,
    loading: true,
    isOwner: false,
    isEmployee: false,
  });

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && isMounted) {
        const { data: business } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        setState({
          user: session.user,
          business,
          employee: null,
          loading: false,
          isOwner: !!business,
          isEmployee: false,
        });
      } else if (isMounted) {
        setState({
          user: null,
          business: null,
          employee: null,
          loading: false,
          isOwner: false,
          isEmployee: false,
        });
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && isMounted) {
          const { data: business } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', session.user.id)
            .single();

          setState({
            user: session.user,
            business,
            employee: null,
            loading: false,
            isOwner: !!business,
            isEmployee: false,
          });
        } else if (isMounted) {
          setState({
            user: null,
            business: null,
            employee: null,
            loading: false,
            isOwner: false,
            isEmployee: false,
          });
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const loginEmployee = async (businessId: string, employeeId: string, passcode: string) => {
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('business_id', businessId)
        .eq('passcode', passcode)
        .eq('is_active', true)
        .single();

      if (employee) {
        const { data: business } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        setState(prev => ({
          ...prev,
          business,
          employee,
          isEmployee: true,
          isOwner: false,
        }));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  return {
    ...state,
    signOut,
    loginEmployee,
  };
}