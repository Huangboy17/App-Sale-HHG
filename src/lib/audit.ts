import { db } from './database';
import type { AuditAction } from './types';

interface LogAuditParams {
  userId?: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export function logAudit(params: LogAuditParams): void {
  db.addAuditLog({
    user_id: params.userId,
    user_name: params.userName,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    field_name: params.fieldName,
    old_value: params.oldValue,
    new_value: params.newValue,
    metadata: params.metadata,
  });
}

// Helper to track field changes between old and new objects
export function trackChanges(
  entityType: string,
  entityId: string,
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  userId: string,
  userName: string,
  fieldsToTrack: string[]
): void {
  if (!oldObj || !newObj) return;

  for (const field of fieldsToTrack) {
    const oldValue = oldObj[field];
    const newValue = newObj[field];

    // Only log if the value actually changed
    if (oldValue !== newValue) {
      logAudit({
        userId,
        userName,
        action: 'UPDATE',
        entityType,
        entityId,
        fieldName: field,
        oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : undefined,
        newValue: newValue !== undefined && newValue !== null ? String(newValue) : undefined,
      });
    }
  }
}
