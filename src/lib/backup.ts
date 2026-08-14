// ============================================================
// localStorage Backup Utility
// Run before migration to backup all data to JSON
// ============================================================

/**
 * Backup all localStorage keys used by the app to a downloadable JSON file.
 * Call this from browser console: backupLocalStorageData()
 */
export function backupLocalStorageData(): void {
  const KEYS_TO_BACKUP = [
    'smapp_users',
    'smapp_products',
    'smapp_customers',
    'smapp_transactions',
    'smapp_activities',
    'smapp_quotations',
    'smapp_quotation_versions',
    'smapp_quotation_items',
    'smapp_sale_quotations',
    'smapp_sale_quotation_items',
    'smapp_sale_quotation_dispatch',
    'smapp_contracts',
    'smapp_contract_items',
    'smapp_payments',
    'smapp_audit_logs',
    'smapp_current_user_id',
    'smapp_sequence_TRX',
    'smapp_sequence_QT',
    'smapp_sequence_CT',
  ];

  const backup: Record<string, any> = {
    _meta: {
      backup_date: new Date().toISOString(),
      app_version: '1.0.0',
      source: 'localStorage',
    },
  };

  for (const key of KEYS_TO_BACKUP) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        backup[key] = JSON.parse(raw);
      } catch {
        backup[key] = raw; // Store as-is if not valid JSON (e.g., sequence counters)
      }
    }
  }

  // Download as JSON file
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smapp_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✅ Backup downloaded successfully!');
  console.log('📦 Keys backed up:', Object.keys(backup).filter(k => k !== '_meta').length);
}

/**
 * Get backup data as object (for programmatic migration)
 */
export function getLocalStorageBackup(): Record<string, any> {
  const KEYS_TO_BACKUP = [
    'smapp_users',
    'smapp_products',
    'smapp_customers',
    'smapp_transactions',
    'smapp_activities',
    'smapp_sale_quotations',
    'smapp_sale_quotation_items',
    'smapp_sale_quotation_dispatch',
    'smapp_contracts',
    'smapp_payments',
    'smapp_audit_logs',
  ];

  const backup: Record<string, any> = {};

  for (const key of KEYS_TO_BACKUP) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        backup[key] = JSON.parse(raw);
      } catch {
        backup[key] = raw;
      }
    }
  }

  return backup;
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).backupLocalStorageData = backupLocalStorageData;
}
