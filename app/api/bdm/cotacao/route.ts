import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = 'ByFx7OvPQB6edmwlWik/wHbifW3nStwWIQBIrAJMRz8='
    
    const response = await fetch(
      'https://partner.douradocash.com.br/ecommerce-partner/clients/quotation/all/BDM',
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        },
        // 🔥 TIMEOUT para não travar
        signal: AbortSignal.timeout(5000)
      }
    )

    if (!response.ok) {
      console.error('❌ API BDM - Status:', response.status);
      return NextResponse.json({
        success: false,
        BRL: 13.55,
        error: `Erro ${response.status}`
      });
    }

    const data = await response.json();
    console.log('📊 Cotação BDM recebida:', data);

    return NextResponse.json({
      success: true,
      BRL: data.BRL || 13.55,
      USD: data.USD || 0,
      EUR: data.EUR || 0
    });

  } catch (error) {
    console.error('❌ Erro ao buscar cotação BDM:', error);
    // 🔥 SEMPRE RETORNAR UM VALOR PADRÃO
    return NextResponse.json({
      success: true,
      BRL: 13.55,
      error: error instanceof Error ? error.message : 'Erro ao buscar cotação'
    });
  }
}