// scripts/check-schema.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que o arquivo .env.local existe e tem:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('=== Verificando estrutura das tabelas ===\n');

  // Verificar tabela profiles
  console.log('📋 Tabela: profiles');
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.error('❌ Erro ao buscar profiles:', profileError.message);
      if (profileError.code === '42P01') {
        console.log('⚠️  Tabela "profiles" não existe no banco de dados');
      } else if (profileError.code === '42501') {
        console.log('⚠️  Sem permissão para acessar a tabela "profiles"');
      }
    } else if (profileData && profileData.length > 0) {
      console.log('✅ Colunas disponíveis em profiles:');
      console.log('   ' + Object.keys(profileData[0]).join(', '));
      console.log(`\n📊 Dados: ${profileData.length} registro(s) encontrado(s)`);
    } else {
      console.log('⚠️  Nenhum dado encontrado em profiles (tabela vazia)');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar profiles:', err.message);
  }

  console.log('\n');

  // Verificar tabela groups
  console.log('📋 Tabela: groups');
  try {
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);

    if (groupError) {
      console.error('❌ Erro ao buscar groups:', groupError.message);
      if (groupError.code === '42P01') {
        console.log('⚠️  Tabela "groups" não existe no banco de dados');
      } else if (groupError.code === '42501') {
        console.log('⚠️  Sem permissão para acessar a tabela "groups"');
      }
    } else if (groupData && groupData.length > 0) {
      console.log('✅ Colunas disponíveis em groups:');
      console.log('   ' + Object.keys(groupData[0]).join(', '));
      console.log(`\n📊 Dados: ${groupData.length} registro(s) encontrado(s)`);
    } else {
      console.log('⚠️  Nenhum dado encontrado em groups (tabela vazia)');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar groups:', err.message);
  }

  console.log('\n');
  console.log('=== FIM ===');
}

checkSchema();
