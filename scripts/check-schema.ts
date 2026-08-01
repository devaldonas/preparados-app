import { supabase } from '../lib/supabaseClient';

async function checkSchema() {
  console.log('=== Verificando estrutura das tabelas ===\n');

  // Verificar tabela profiles
  console.log('📋 Tabela: profiles');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profileError) {
    console.error('❌ Erro ao buscar profiles:', profileError.message);
    console.log('Tabela profiles pode não existir ou não ter permissão');
  } else if (profileData && profileData.length > 0) {
    console.log('✅ Colunas disponíveis em profiles:');
    console.log(Object.keys(profileData[0]).join(', '));
  } else {
    console.log('⚠️  Nenhum dado encontrado em profiles (tabela vazia)');
  }

  console.log('\n');

  // Verificar tabela groups
  console.log('📋 Tabela: groups');
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .limit(1);

  if (groupError) {
    console.error('❌ Erro ao buscar groups:', groupError.message);
    console.log('Tabela groups pode não existir ou não ter permissão');
  } else if (groupData && groupData.length > 0) {
    console.log('✅ Colunas disponíveis em groups:');
    console.log(Object.keys(groupData[0]).join(', '));
  } else {
    console.log('⚠️  Nenhum dado encontrado em groups (tabela vazia)');
  }
}

checkSchema();
