import { redirect } from 'next/navigation';

export default async function AnalyzeDocPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  redirect(`/analyze?doc=${resolvedParams.id}`);
}
