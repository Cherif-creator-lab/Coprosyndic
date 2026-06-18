// neonClient.js — Remplace supabaseClient.js
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_ad0xpElYO1MI@ep-autumn-cell-ath4vnm1.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(DATABASE_URL);
