import React, { useState, useEffect } from 'react';
import { Save, Building, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase, Business } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function Settings() {
  const { business, user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [settings, setSettings] = useState({
    pos_type: 'simple' as 'simple' | 'calculator',
    auto_logout: false,
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (business) {
      setBusinessName(business.name);
      setSettings(business.settings);
    }
  }, [business]);

  const handleSave = async () => {
    if (!business?.id) return;

    setLoading(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessName,
          settings,
        })
        .eq('id', business.id);

      if (error) throw error;

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      alert('Error saving settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Settings</h1>

      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Business Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* POS Settings */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">POS Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">POS Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="simple"
                    checked={settings.pos_type === 'simple'}
                    onChange={(e) => setSettings(prev => ({ ...prev, pos_type: e.target.value as 'simple' }))}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Simple POS (Product-based)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="calculator"
                    checked={settings.pos_type === 'calculator'}
                    onChange={(e) => setSettings(prev => ({ ...prev, pos_type: e.target.value as 'calculator' }))}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Calculator POS (Custom items)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Auto Logout</label>
                <p className="text-sm text-gray-500">Automatically log out users after inactivity</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, auto_logout: !prev.auto_logout }))}
                className={`inline-flex items-center ${
                  settings.auto_logout ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {settings.auto_logout ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {saveMessage && (
              <p className="text-green-600 text-sm">{saveMessage}</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}