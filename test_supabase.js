const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://lkksilhmmyyhrilkerqe.supabase.co',
  'sb_publishable_mAuuor3Pbj7hgOP7mwoo9w_zGgDVYHe'
);

async function test() {
  console.log('Testing Supabase connection...');
  
  const { data: res, error: errRes } = await supabase.from('residences').select('*');
  console.log('RESIDENCES - data:', JSON.stringify(res), 'error:', JSON.stringify(errRes));
  
  const { data: cli, error: errCli } = await supabase.from('clients').select('*');
  console.log('CLIENTS - data:', JSON.stringify(cli), 'error:', JSON.stringify(errCli));
  
  const { data: pay, error: errPay } = await supabase.from('payments').select('*').limit(5);
  console.log('PAYMENTS (5) - data:', JSON.stringify(pay), 'error:', JSON.stringify(errPay));
  
  const { data: hist, error: errHist } = await supabase.from('payment_history').select('*').limit(5);
  console.log('HISTORY (5) - data:', JSON.stringify(hist), 'error:', JSON.stringify(errHist));
}

test().catch(console.error);
