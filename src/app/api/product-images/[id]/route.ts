import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodeProductImage } from "@/lib/product-image-storage";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuid.test(id)) return new NextResponse(null, { status: 404 });

  const image = await prisma.productImage.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  const storedImage = image ? decodeProductImage(image.storageKey) : null;
  if (!storedImage) return new NextResponse(null, { status: 404 });

  return new Response(storedImage.bytes, {
    headers: {
      "Content-Type": storedImage.contentType,
      "Content-Length": String(storedImage.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
