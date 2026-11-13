const DATA_IMAGE_PATTERN =
  /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_DATA_IMAGE_LENGTH = 2_100_000;

export function productImagePublicUrl(storageKey: string, imageId?: string) {
  if (storageKey.startsWith("/") && !storageKey.startsWith("//"))
    return storageKey;

  if (
    imageId &&
    storageKey.length <= MAX_DATA_IMAGE_LENGTH &&
    DATA_IMAGE_PATTERN.test(storageKey)
  )
    return `/api/product-images/${encodeURIComponent(imageId)}`;

  try {
    const url = new URL(storageKey);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function decodeProductImage(storageKey: string) {
  if (storageKey.length > MAX_DATA_IMAGE_LENGTH) return null;
  const match = DATA_IMAGE_PATTERN.exec(storageKey);
  if (!match) return null;

  const contentType = match[1]!;
  const bytes = Buffer.from(match[2]!, "base64");
  const validSignature =
    (contentType === "image/jpeg" &&
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (contentType === "image/png" &&
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a) ||
    (contentType === "image/webp" &&
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP");

  return validSignature ? { contentType, bytes } : null;
}
