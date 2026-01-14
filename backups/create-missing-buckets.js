import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔧 Creando buckets faltantes...\n');

  const bucketsToCreate = [
    {
      name: 'invoices',
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf']
    },
    {
      name: 'comprobantes-cuotas',
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    }
  ];

  for (const bucket of bucketsToCreate) {
    console.log(`📦 Creando bucket: ${bucket.name}...`);

    const { data, error } = await supabaseNew.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  Ya existe`);
      } else {
        console.error(`   ❌ Error:`, error.message);
      }
    } else {
      console.log(`   ✅ Creado exitosamente`);
    }
  }

  console.log('\n✅ Proceso completado!');
}

main().catch(console.error);
