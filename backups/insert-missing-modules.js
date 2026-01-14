import { createClient } from '@supabase/supabase-js';

const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.qVEwxvaSdl1nHQlOxqgMAe0k4uBi55DsOpaOpZ7pifo'
);

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('🔧 Insertando módulos faltantes...\n');

  const { data: oldModules } = await supabaseOld.from('modules').select('*');
  const { data: newModules } = await supabaseNew.from('modules').select('slug');

  const newModuleSlugs = newModules.map(m => m.slug);
  const missingModules = oldModules.filter(m => !newModuleSlugs.includes(m.slug));

  if (missingModules.length === 0) {
    console.log('✅ No hay módulos faltantes!');
    return;
  }

  console.log(`📋 Módulos que faltan: ${missingModules.map(m => m.slug).join(', ')}\n`);

  for (const module of missingModules) {
    console.log(`📦 Insertando: ${module.slug}...`);

    // NO incluir id ni parent_id (temporal) para evitar FK issues
    const { id, parent_id, ...moduleData } = module;

    const { error } = await supabaseNew
      .from('modules')
      .insert({ ...moduleData, parent_id: null });

    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Insertado`);
    }
  }

  console.log('\n✅ Módulos faltantes insertados!');
}

main().catch(console.error);
