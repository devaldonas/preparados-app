// app/download/[slug]/route.ts
import { NextResponse } from 'next/server';

// 🔥 Mapeamento dos e-books (slug -> URL real)
const ebookMap: Record<string, string> = {
  'aph-primeiros-socorros': 'https://svzaaiwxdgswnttrzvgp.supabase.co/storage/v1/object/public/produtos/EBOOK_APH_NOCOES_DE_PRMEIROS_SOCORROS%20.pdf',
  // Adicione outros e-books aqui no futuro
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const fileUrl = ebookMap[params.slug];

  if (!fileUrl) {
    return new NextResponse('Arquivo não encontrado', { status: 404 });
  }

  // 🔥 Redireciona para a URL real do arquivo
  return NextResponse.redirect(fileUrl);
}