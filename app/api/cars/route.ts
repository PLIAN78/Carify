import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const cars = await prisma.car.findMany({
    where: q
      ? {
          OR: [
            { make: { contains: q } },
            { model: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ cars });
}
