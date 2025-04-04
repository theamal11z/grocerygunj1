import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  whatsapp?: string;
  chatEnabled?: boolean;
  callEnabled?: boolean;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
}

export interface SupportHours {
  weekdays?: string;
  weekends?: string;
  holidays?: string;
  note?: string;
}

export interface SupportSettings {
  faqs: FAQ[];
  contactInfo: ContactInfo;
  supportHours: SupportHours;
  supportNote?: string;
}

// Default support settings if none are found
const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  faqs: [
    {
      id: '1',
      question: 'How do I track my order?',
      answer: 'You can track your order by going to the Orders tab and selecting the specific order. You\'ll see real-time updates on your order status and estimated delivery time.',
      category: 'orders',
      order: 1
    },
    {
      id: '2',
      question: 'What is your return policy?',
      answer: 'We accept returns within 24 hours of delivery if the products are unused and in their original packaging. For perishable items, please report any issues immediately upon delivery.',
      category: 'returns',
      order: 2
    },
    {
      id: '3',
      question: 'How can I change my delivery address?',
      answer: 'You can manage your delivery addresses in the Profile section under "My Addresses". You can add, edit, or remove addresses and set a default delivery location.',
      category: 'account',
      order: 3
    }
  ],
  contactInfo: {
    phone: '+91 1234567890',
    email: 'support@groceryguj.com',
    whatsapp: '+91 1234567890',
    chatEnabled: true,
    callEnabled: true,
    emailEnabled: true,
    whatsappEnabled: true
  },
  supportHours: {
    weekdays: 'Monday to Friday: 9:00 AM - 8:00 PM',
    weekends: 'Saturday & Sunday: 10:00 AM - 6:00 PM',
    holidays: 'Closed on public holidays'
  },
  supportNote: 'We aim to respond to all inquiries within 2 hours during business hours.'
};

export function useHelpSupport() {
  const { user } = useAuth();
  const [supportSettings, setSupportSettings] = useState<SupportSettings>(DEFAULT_SUPPORT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchResults, setSearchResults] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch support settings from the database
  const fetchSupportSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data')
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, let's create default ones
          await createDefaultSupportSettings();
          return;
        }
        throw new Error(`Error fetching support settings: ${error.message}`);
      }
      
      if (data?.settings_data?.supportSettings) {
        // Support settings exist, use them
        setSupportSettings(data.settings_data.supportSettings);
      } else {
        // Support settings don't exist, add them to the settings object
        await updateSettingsWithSupportDefaults(data.settings_data || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch support settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Create default settings if none exist
  const createDefaultSupportSettings = async () => {
    try {
      const defaultSettings = {
        supportSettings: DEFAULT_SUPPORT_SETTINGS
      };
      
      await supabase
        .from('settings')
        .insert({ settings_data: defaultSettings });
      
      setSupportSettings(DEFAULT_SUPPORT_SETTINGS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create support settings'));
    } finally {
      setLoading(false);
    }
  };

  // Update existing settings with support settings
  const updateSettingsWithSupportDefaults = async (currentSettings: any) => {
    try {
      const updatedSettings = {
        ...currentSettings,
        supportSettings: DEFAULT_SUPPORT_SETTINGS
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
      
      setSupportSettings(DEFAULT_SUPPORT_SETTINGS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update settings'));
    } finally {
      setLoading(false);
    }
  };

  // Search FAQs
  const searchFAQs = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = supportSettings.faqs.filter(
      faq => 
        faq.question.toLowerCase().includes(normalizedQuery) || 
        faq.answer.toLowerCase().includes(normalizedQuery) ||
        (faq.category && faq.category.toLowerCase().includes(normalizedQuery))
    );
    
    setSearchResults(results);
  }, [supportSettings.faqs]);

  // Get FAQs by category
  const getFAQsByCategory = useCallback((category: string) => {
    return supportSettings.faqs.filter(
      faq => faq.category === category
    ).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [supportSettings.faqs]);

  // Submit a support request (placeholder for future implementation)
  const submitSupportRequest = useCallback(async (message: string, subject: string, contactMethod: string) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to submit a support request');
      }
      
      // Here we would integrate with your support system
      // This is a placeholder for future implementation
      
      return { success: true, message: 'Support request submitted successfully' };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to submit support request' 
      };
    }
  }, [user]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSupportSettings();
  }, [fetchSupportSettings]);

  return {
    supportSettings,
    loading,
    error,
    searchQuery,
    searchResults,
    searchFAQs,
    getFAQsByCategory,
    submitSupportRequest,
    refreshSupportSettings: fetchSupportSettings
  };
} 