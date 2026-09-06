import type { Metadata } from 'next'

type ProjectDetailsPageProps = {
  params: Promise<{ slug: string }>
}

// TODO: substituir pelo fetch real de um projeto via API usando `params.slug`.
export async function generateMetadata({
  params,
}: ProjectDetailsPageProps): Promise<Metadata> {
  const { slug } = await params

  return {
    title: 'Project — CarShop',
    description: 'Project details — page under construction.',
    openGraph: {
      title: 'Project — CarShop',
      description: 'Project details — page under construction.',
      type: 'article',
    },
    alternates: {
      canonical: `/portfolio/${slug}`,
    },
  }
}

export default async function ProjectDetailsPage({
  params,
}: Readonly<ProjectDetailsPageProps>) {
  const { slug } = await params

  return (
    <main>
      <h1>Project — CarShop</h1>
      <p>Página em construção para o projeto &quot;{slug}&quot;.</p>
    </main>
  )
}
