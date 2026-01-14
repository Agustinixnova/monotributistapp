import { createClient } from '@supabase/supabase-js';

const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.qVEwxvaSdl1nHQlOxqgMAe0k4uBi55DsOpaOpZ7pifo'
);

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function getColumns(supabase, tableName, projectName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    // Try direct query
    const result = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (result.data && result.data.length > 0) {
      return Object.keys(result.data[0]);
    }
    return null;
  }

  return data;
}

async function main() {
  console.log('\n🔍 Comparando schema de profiles...\n');

  // Get one row from each to see columns
  const { data: oldData } = await supabaseOld.from('profiles').select('*').limit(1);
  const { data: newData } = await supabaseNew.from('profiles').select('*').limit(1);

  const oldColumns = oldData && oldData.length > 0 ? Object.keys(oldData[0]) : [];
  const newColumns = newData && newData.length > 0 ? Object.keys(newData[0]) : [];

  console.log('📊 Proyecto USA (VIEJO):');
  console.log('Columnas:', oldColumns.sort().join(', '));

  console.log('\n📊 Proyecto São Paulo (NUEVO):');
  console.log('Columnas:', newColumns.sort().join(', '));

  const onlyInOld = oldColumns.filter(c => !newColumns.includes(c));
  const onlyInNew = newColumns.filter(c => !oldColumns.includes(c));

  if (onlyInOld.length > 0) {
    console.log('\n❌ Columnas que existen en VIEJO pero NO en NUEVO:');
    console.log(onlyInOld.join(', '));
  }

  if (onlyInNew.length > 0) {
    console.log('\n✅ Columnas que existen en NUEVO pero NO en VIEJO:');
    console.log(onlyInNew.join(', '));
  }
}

main().catch(console.error);
