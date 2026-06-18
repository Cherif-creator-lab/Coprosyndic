import { createClient } from '@supabase/supabase-js';  
const s = createClient('https://lkksilhmmyyhrilkerqe.supabase.co','sb_publishable_mAuuor3Pbj7hgOP7mwoo9w_zGgDVYHe');  
s.from('residences').select('*').then(r =, r.data?.length, r.error));  
