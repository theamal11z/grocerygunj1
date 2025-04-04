/*
  # Add Delivery Settings

  This migration adds default delivery settings to the settings table:
  1. Adds deliverySettings object to settings_data
  2. Initializes with default values
*/

-- Create or update settings record with delivery settings
DO $$
DECLARE
  settings_id uuid;
  settings_json jsonb;
BEGIN
  -- Check if settings record exists - use table alias 's' to avoid ambiguity
  SELECT s.id, s.settings_data INTO settings_id, settings_json
  FROM settings s
  ORDER BY s.created_at
  LIMIT 1;
  
  -- Initialize settings_data if NULL
  IF settings_json IS NULL THEN
    settings_json := '{}'::jsonb;
  END IF;
  
  -- Add delivery settings if they don't exist
  IF NOT (settings_json ? 'deliverySettings') THEN
    settings_json := jsonb_set(
      settings_json,
      '{deliverySettings}',
      '{
        "deliveryFee": 40,
        "freeDeliveryThreshold": null,
        "enableFreeDelivery": false
      }'::jsonb,
      true
    );
    
    -- Update or insert settings record
    IF settings_id IS NOT NULL THEN
      UPDATE settings
      SET settings_data = settings_json,
          updated_at = NOW()
      WHERE id = settings_id;
      
      RAISE NOTICE 'Updated settings with delivery settings';
    ELSE
      INSERT INTO settings (settings_data, created_at, updated_at)
      VALUES (settings_json, NOW(), NOW());
      
      RAISE NOTICE 'Created new settings record with delivery settings';
    END IF;
  ELSE
    RAISE NOTICE 'Delivery settings already exist in settings table';
  END IF;
END $$; 