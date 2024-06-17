import { NextResponse } from 'next/server'

const ebookMap: Record<string, string> = {
  'aph-primeiros-socorros': 'https://svzaaiwxdgswnttrzvgp.supabase.co/storage/v1/object/public/produtos/EBOOK_APH_NOCOES_DE_PRMEIROS_SOCORROS%20.pdf',
}

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  const { slug } = context.params

  const fileUrl = ebookMap[slug]

  if (!fileUrl) {
    return new Response('Arquivo não encontrado', { status: 404 })
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: fileUrl,
    },
  })
}