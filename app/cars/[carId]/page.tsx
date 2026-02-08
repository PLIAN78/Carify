import { prisma } from "@/lib/db";

export default async function CarPage({
  params,
}: {
  params: { carId: string };
}) {
  const car = await prisma.car.findUnique({
    where: { id: params.carId },
    include: { claims: { orderBy: { createdAt: "desc" } } },
  });

  if (!car) return <div className="p-6">Car not found</div>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">
        {car.make} {car.model} ({car.year})
      </h1>

      <a
        href={`/submit/${car.id}`}
        className="inline-block mt-4 px-4 py-2 rounded bg-black text-white"
      >
        Submit a report
      </a>

      <div className="mt-6 space-y-4">
        {car.claims.map((c) => (
          <div key={c.id} className="border rounded p-4">
            <div className="text-sm text-gray-500">
              Status: {c.status} · Score: {c.proofQuality}
            </div>
            <p className="mt-2">{c.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
