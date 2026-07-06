// lib/pix.ts
export function gerarPIX(chave: string, valor: number): string {
  console.log('📦 Gerando PIX para valor:', valor);
  console.log('🔑 Chave:', chave);
  console.log('📏 Tamanho da chave:', chave.length);
  
  // ⭐ FORMATAR VALOR COM 2 CASAS DECIMAIS E PONTO
  const valorComPonto = valor.toFixed(2); // "1.00" ou "16.90"
  const tamanhoValor = String(valorComPonto.length).padStart(2, '0'); // "04"
  const tamanhoChave = String(chave.length).padStart(2, '0');
  
  console.log('📝 Valor com ponto:', valorComPonto);
  console.log('📏 Tamanho do valor:', tamanhoValor);
  console.log('📏 Tamanho da chave:', tamanhoChave);
  
  // Nome e cidade - SEM ACENTOS
  const nome = "PREPARADO";
  const cidade = "SAO PAULO";
  const tamanhoNome = String(nome.length).padStart(2, '0');
  const tamanhoCidade = String(cidade.length).padStart(2, '0');
  
  // Campo 26 - Merchant Account Information
  const conteudo26 = 
    '00' + '14' + 'BR.GOV.BCB.PIX' + 
    '01' + tamanhoChave + chave;
  
  const tamanho26 = String(conteudo26.length).padStart(2, '0');
  console.log('📦 Conteúdo do campo 26:', conteudo26);
  console.log('📏 Tamanho do campo 26:', tamanho26);
  
  // ⭐ MONTAR PAYLOAD COM VALOR COM PONTO
  const payloadSemCRC = 
    '000201' +
    '26' + tamanho26 + conteudo26 +
    '52' + '04' + '0000' +
    '53' + '03' + '986' +
    '54' + tamanhoValor + valorComPonto +  // ⭐ "54041.00" ou "540516.90"
    '58' + '02' + 'BR' +
    '59' + tamanhoNome + nome +
    '60' + tamanhoCidade + cidade +
    '62' + '07' + '05' + '03' + '***' +
    '63' + '04';
  
  console.log('📦 Payload sem CRC:', payloadSemCRC);
  console.log('📏 Tamanho do payload (sem CRC):', payloadSemCRC.length);
  
  // Calcular CRC16
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  
  for (let i = 0; i < payloadSemCRC.length; i++) {
    crc ^= payloadSemCRC.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  const crcHex = (crc ^ 0x0000).toString(16).toUpperCase().padStart(4, '0');
  console.log('🔢 CRC16 calculado:', crcHex);
  
  const payloadFinal = payloadSemCRC + crcHex;
  console.log('✅ Payload final:', payloadFinal);
  console.log('📏 Tamanho total:', payloadFinal.length);
  
  return payloadFinal;
}