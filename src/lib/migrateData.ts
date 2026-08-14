// ============================================================
// Data Migration Tool: localStorage -> Supabase
// Migrates existing local data into Supabase multi-tenant tables
// ============================================================

import { supabase } from './supabaseClient';
import { getOrganizationId } from './supabaseDatabase';
import { KEYS } from './database';
import type {
  Product, Customer, SaleQuotation, SaleQuotationItem,
  QuotationDispatchSummary
} from './types';

export interface MigrationReport {
  products: { total: number; success: number; failed: number; errors: string[] };
  customers: { total: number; success: number; failed: number; errors: string[] };
  quotations: { total: number; success: number; failed: number; errors: string[] };
  dispatches: { total: number; success: number; failed: number; errors: string[] };
  completedAt: string;
}

export async function migrateLocalStorageToSupabase(): Promise<MigrationReport> {
  console.log('🚀 Bắt đầu quá trình chuyển dữ liệu từ localStorage sang Supabase...');

  const report: MigrationReport = {
    products: { total: 0, success: 0, failed: 0, errors: [] },
    customers: { total: 0, success: 0, failed: 0, errors: [] },
    quotations: { total: 0, success: 0, failed: 0, errors: [] },
    dispatches: { total: 0, success: 0, failed: 0, errors: [] },
    completedAt: '',
  };

  try {
    const orgId = await getOrganizationId();
    console.log('🏢 Đang migrate vào Organization ID:', orgId);

    // 1. MIGRATE PRODUCTS
    const rawProducts = localStorage.getItem(KEYS.PRODUCTS);
    if (rawProducts) {
      const products: Product[] = JSON.parse(rawProducts);
      report.products.total = products.length;

      for (const p of products) {
        try {
          const { error } = await supabase.from('products').upsert(
            {
              id: p.id,
              organization_id: orgId,
              product_code: p.product_code,
              product_name: p.product_name,
              brand: p.brand || '',
              product_group: p.product_group || '',
              unit: p.unit || 'Cái',
              base_price: p.base_price || 0,
              max_discount_rate: p.max_discount_rate || 0,
              dp_price: p.dp_price || 0,
              vat_rate: p.vat_rate ?? 0.08,
              stock_quantity: p.stock_quantity || 0,
              reserved_quantity: p.reserved_quantity || 0,
              status: p.status || 'ACTIVE',
              description: p.description || null,
              image_url: p.image_url || p.images?.[0] || null,
            },
            { onConflict: 'organization_id, product_code' }
          );

          if (error) {
            report.products.failed++;
            report.products.errors.push(`${p.product_code}: ${error.message}`);
          } else {
            report.products.success++;
          }
        } catch (e: any) {
          report.products.failed++;
          report.products.errors.push(`${p.product_code}: ${e.message}`);
        }
      }
      console.log(`✅ Products: ${report.products.success}/${report.products.total}`);
    }

    // 2. MIGRATE CUSTOMERS
    const rawCustomers = localStorage.getItem(KEYS.CUSTOMERS);
    if (rawCustomers) {
      const customers: Customer[] = JSON.parse(rawCustomers);
      report.customers.total = customers.length;

      for (const c of customers) {
        try {
          const { error } = await supabase.from('customers').upsert(
            {
              id: c.id,
              organization_id: orgId,
              customer_name: c.customer_name,
              company_name: c.company_name || null,
              contact_person: c.contact_person || null,
              phone: c.phone || null,
              email: c.email || null,
              address: c.address || null,
              source: c.source || null,
              tax_code: c.tax_code || null,
              notes: c.notes || null,
              status: c.status || 'NEW',
              is_active: c.is_active ?? true,
            },
            { onConflict: 'id' }
          );

          if (error) {
            report.customers.failed++;
            report.customers.errors.push(`${c.customer_name}: ${error.message}`);
          } else {
            report.customers.success++;
          }
        } catch (e: any) {
          report.customers.failed++;
          report.customers.errors.push(`${c.customer_name}: ${e.message}`);
        }
      }
      console.log(`✅ Customers: ${report.customers.success}/${report.customers.total}`);
    }

    // 3. MIGRATE SALE QUOTATIONS & ITEMS & TERMS
    const rawQuotations = localStorage.getItem(KEYS.SALE_QUOTATIONS);
    const rawQuotationItems = localStorage.getItem(KEYS.SALE_QUOTATION_ITEMS);

    if (rawQuotations) {
      const quotations: SaleQuotation[] = JSON.parse(rawQuotations);
      const allItems: SaleQuotationItem[] = rawQuotationItems ? JSON.parse(rawQuotationItems) : [];
      report.quotations.total = quotations.length;

      for (const q of quotations) {
        try {
          // Upsert quotation
          const { error: qError } = await supabase.from('sale_quotations').upsert(
            {
              id: q.id,
              organization_id: orgId,
              quotation_code: q.quotation_code,
              customer_id: q.customer_id,
              quotation_date: q.quotation_date,
              status: q.status || 'DRAFT',
              total_amount: q.total_amount || 0,
              note: q.note || null,
            },
            { onConflict: 'organization_id, quotation_code' }
          );

          if (qError) {
            report.quotations.failed++;
            report.quotations.errors.push(`${q.quotation_code}: ${qError.message}`);
            continue;
          }

          // Items for this quotation
          const qItems = allItems.filter((item) => item.quotation_id === q.id);
          if (qItems.length > 0) {
            // Delete old items then insert
            await supabase.from('sale_quotation_items').delete().eq('quotation_id', q.id);
            const itemRows = qItems.map((item) => ({
              id: item.id,
              quotation_id: q.id,
              product_id: item.product_id || null,
              product_code: item.product_code,
              product_name: item.product_name,
              brand: item.brand || '',
              unit: item.unit || '',
              image_url: item.image_url || null,
              listed_price: item.listed_price || 0,
              dp_price: item.dp_price || 0,
              quantity: item.quantity,
              sale_price: item.sale_price,
              note: item.note || null,
            }));
            await supabase.from('sale_quotation_items').insert(itemRows);
          }

          // Terms for this quotation
          if (q.terms && q.terms.length > 0) {
            await supabase.from('quotation_terms').delete().eq('quotation_id', q.id);
            const termRows = q.terms.map((t, idx) => ({
              quotation_id: q.id,
              term_title: t.term_title,
              term_content: t.term_content,
              display_order: t.display_order || idx + 1,
              is_visible: t.is_visible ?? true,
            }));
            await supabase.from('quotation_terms').insert(termRows);
          }

          report.quotations.success++;
        } catch (e: any) {
          report.quotations.failed++;
          report.quotations.errors.push(`${q.quotation_code}: ${e.message}`);
        }
      }
      console.log(`✅ Quotations: ${report.quotations.success}/${report.quotations.total}`);
    }

    // 4. MIGRATE QUOTATION DISPATCH
    const rawDispatch = localStorage.getItem(KEYS.SALE_QUOTATION_DISPATCH);
    if (rawDispatch) {
      const dispatches: QuotationDispatchSummary[] = JSON.parse(rawDispatch);
      report.dispatches.total = dispatches.length;

      for (const d of dispatches) {
        try {
          const { data: insertedDispatch, error: dError } = await supabase
            .from('quotation_dispatches')
            .upsert(
              {
                quotation_id: d.quotation_id,
                closed_at: d.closed_at,
                total_products: d.total_products,
                sufficient_products: d.sufficient_products,
                insufficient_products: d.insufficient_products,
                total_hold_qty: d.total_hold_qty,
                total_order_qty: d.total_order_qty,
              },
              { onConflict: 'quotation_id' }
            )
            .select('id')
            .single();

          if (dError) {
            report.dispatches.failed++;
            report.dispatches.errors.push(`Dispatch for ${d.quotation_id}: ${dError.message}`);
            continue;
          }

          if (insertedDispatch && d.items && d.items.length > 0) {
            await supabase
              .from('quotation_dispatch_items')
              .delete()
              .eq('dispatch_id', insertedDispatch.id);

            const dItemRows = d.items.map((item) => ({
              id: item.id,
              dispatch_id: insertedDispatch.id,
              product_id: item.product_id || null,
              product_code: item.product_code,
              product_name: item.product_name,
              brand: item.brand || '',
              unit: item.unit || '',
              ordered_quantity: item.ordered_quantity,
              stock_snapshot: item.stock_snapshot,
              hold_quantity: item.hold_quantity,
              needed_quantity: item.needed_quantity,
              status_hold: item.status_hold || null,
              status_order: item.status_order || null,
              notes: item.notes || null,
            }));

            await supabase.from('quotation_dispatch_items').insert(dItemRows);
          }

          report.dispatches.success++;
        } catch (e: any) {
          report.dispatches.failed++;
          report.dispatches.errors.push(`Dispatch for ${d.quotation_id}: ${e.message}`);
        }
      }
      console.log(`✅ Dispatches: ${report.dispatches.success}/${report.dispatches.total}`);
    }

  } catch (globalErr: any) {
    console.error('❌ Migration failed:', globalErr);
  }

  report.completedAt = new Date().toISOString();
  console.log('🎉 Quá trình migration hoàn tất!', report);
  return report;
}

// Expose to window for easy triggering via browser console
if (typeof window !== 'undefined') {
  (window as any).migrateLocalStorageToSupabase = migrateLocalStorageToSupabase;
}
