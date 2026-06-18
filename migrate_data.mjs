import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';

const supabase = createClient(
  'https://lkksilhmmyyhrilkerqe.supabase.co',
  'sb_publishable_mAuuor3Pbj7hgOP7mwoo9w_zGgDVYHe'
);

const sql = neon('postgresql://neondb_owner:npg_ad0xpElYO1MI@ep-autumn-cell-ath4vnm1.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function migrate() {
  console.log('Fetching data from Supabase...');
  
  const { data: residences, error: resErr } = await supabase.from('residences').select('*');
  if (resErr) {
    console.error('Error fetching residences from Supabase. Project might be paused or key invalid:', resErr);
    return;
  }
  
  const { data: clients } = await supabase.from('clients').select('*');
  const { data: payments } = await supabase.from('payments').select('*');
  const { data: history } = await supabase.from('payment_history').select('*');

  console.log(`Found: ${residences?.length || 0} residences, ${clients?.length || 0} clients, ${payments?.length || 0} payments, ${history?.length || 0} history records`);

  if (!residences || residences.length === 0) {
      console.log("No data found in Supabase to migrate.");
      return;
  }

  console.log('Inserting into Neon...');

  // Residences
  for (const r of residences) {
    await sql`
      INSERT INTO residences (id, name, address, titre_foncier, apartments, cotisation, years, created_at)
      VALUES (${r.id}, ${r.name}, ${r.address}, ${r.titre_foncier}, ${r.apartments}, ${r.cotisation}, ${r.years}, ${r.created_at})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log('Residences migrated.');

  // Clients
  if (clients) {
    for (const c of clients) {
      await sql`
        INSERT INTO clients (id, residence_id, name, apt_number, phone, floor, cin, created_at)
        VALUES (${c.id}, ${c.residence_id}, ${c.name}, ${c.apt_number}, ${c.phone}, ${c.floor}, ${c.cin}, ${c.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('Clients migrated.');
  }

  // Payments
  if (payments) {
    for (const p of payments) {
      await sql`
        INSERT INTO payments (id, residence_id, apt_number, year, month, status)
        VALUES (${p.id}, ${p.residence_id}, ${p.apt_number}, ${p.year}, ${p.month}, ${p.status})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('Payments migrated.');
  }

  // Payment History
  if (history) {
    for (const h of history) {
      await sql`
        INSERT INTO payment_history (id, residence_id, apt_number, client_name, receipt_id, paid_months_str, total_amount, created_at)
        VALUES (${h.id}, ${h.residence_id}, ${h.apt_number}, ${h.client_name}, ${h.receipt_id}, ${h.paid_months_str}, ${h.total_amount}, ${h.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('Payment history migrated.');
  }

  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
