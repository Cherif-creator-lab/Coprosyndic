import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lkksilhmmyyhrilkerqe.supabase.co';
const supabaseAnonKey = 'sb_publishable_mAuuor3Pbj7hgOP7mwoo9w_zGgDVYHe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
