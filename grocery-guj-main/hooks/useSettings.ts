import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface DeliverySettings {
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  enableFreeDelivery: boolean;
}

export function useSettings() {
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    deliveryFee: 40, // Default value
    freeDeliveryThreshold: null,
    enableFreeDelivery: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching app settings...');
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data')
        .limit(1)
        .single();
      
      if (error) {
        
        if (error.code === 'PGRST116') {
          console.log('No settings found, creating default settings');
          await createDefaultSettings();
          return;
        }
        throw new Error(`Error fetching settings: ${error.message}`);
      }
      
      console.log('Settings data fetched successfully:', JSON.stringify(data?.settings_data));
      
      if (data?.settings_data?.deliverySettings) {
        const settings = data.settings_data.deliverySettings;
        console.log('Delivery settings found:', JSON.stringify(settings));
        setDeliverySettings({
          deliveryFee: settings.deliveryFee || 40,
          freeDeliveryThreshold: settings.freeDeliveryThreshold,
          enableFreeDelivery: settings.enableFreeDelivery || false
        });
        console.log(`Set delivery fee to: ₹${settings.deliveryFee || 40}`);
      } else {
        console.log('No delivery settings found, updating with defaults');
        await updateSettingsWithDeliveryDefaults(data.settings_data || {});
      }
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        deliverySettings: {
          deliveryFee: 40,
          freeDeliveryThreshold: null,
          enableFreeDelivery: false
        }
      };
      
      await supabase
        .from('settings')
        .insert({ settings_data: defaultSettings });
      
      setDeliverySettings({
        deliveryFee: 40,
        freeDeliveryThreshold: null,
        enableFreeDelivery: false
      });
    } catch (err) {
      
      setError(err instanceof Error ? err : new Error('Failed to create settings'));
    }
  };

  const updateSettingsWithDeliveryDefaults = async (currentSettings: any) => {
    try {
      const updatedSettings = {
        ...currentSettings,
        deliverySettings: {
          deliveryFee: 40,
          freeDeliveryThreshold: null,
          enableFreeDelivery: false
        }
      };
      
      const { data: settingsRecord } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single();
      
      if (settingsRecord) {
        await supabase
          .from('settings')
          .update({ settings_data: updatedSettings })
          .eq('id', settingsRecord.id);
      }
      
      setDeliverySettings({
        deliveryFee: 40,
        freeDeliveryThreshold: null,
        enableFreeDelivery: false
      });
    } catch (err) {
      
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    deliverySettings,
    loading,
    error,
    refreshSettings: fetchSettings
  };
} 