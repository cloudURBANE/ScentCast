import axios from "axios";
import sharp from "sharp";

async function normalizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .trim({ threshold: 10 })
      .resize(500, 500, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 50, bottom: 50, left: 50, right: 50, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return buffer;
  }
}

export async function removeBg(input: string, isUrl = false) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  const toDataUri = (buffer: Buffer, type = "image/png") => `data:${type};base64,${buffer.toString("base64")}`;

  let rawBuffer: Buffer;
  let contentType = "image/jpeg";

  try {
    if (isUrl && input.startsWith("http")) {
      const res = await axios.get(input, {
        responseType: 'arraybuffer',
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      rawBuffer = Buffer.from(res.data);
      contentType = (res.headers['content-type'] as string) || 'image/jpeg';
    } else if (isUrl && input.startsWith("data:")) {
      const parts = input.split(",");
      rawBuffer = Buffer.from(parts[1], "base64");
      contentType = parts[0].split(":")[1].split(";")[0];
    } else {
      return { cleanImage: input };
    }
  } catch {
    return { cleanImage: input };
  }

  if (!apiKey) {
    const normalized = await normalizeImage(rawBuffer);
    return { cleanImage: toDataUri(normalized) };
  }

  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("image_file", rawBuffer, "image.jpg");
    formData.append("size", "auto");
    formData.append("type", "product");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: { ...formData.getHeaders(), "X-Api-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 20000,
      validateStatus: (status) => status < 500
    });

    if (response.status !== 200) {
      const normalized = await normalizeImage(rawBuffer);
      return { cleanImage: toDataUri(normalized) };
    }

    const normalized = await normalizeImage(Buffer.from(response.data));
    return { cleanImage: toDataUri(normalized) };
  } catch {
    const normalized = await normalizeImage(rawBuffer);
    return { cleanImage: toDataUri(normalized) };
  }
}
