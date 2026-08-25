import RepDetailClient from "./RepDetailClient";

export default async function RepDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <RepDetailClient userId={userId} />;
}
