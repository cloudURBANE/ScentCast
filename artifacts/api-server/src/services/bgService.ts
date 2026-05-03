import axios from "axios";
import sharp from "sharp";

async function padAndCenter(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(600, 600, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 30, bottom: 30, left: 30, right: 30, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function trimWhiteAndNormalize(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .trim({ threshold: 40 })
      .resize(600, 600, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 30, bottom: 30, left: 30, right: 30, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function callRemoveBgWithFile(buffer: Buffer, apiKey: string): Promise<Buffer | null> {
  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("image_file", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    formData.append("size", "auto");
    formData.append("type", "product");
    formData.append("format", "png");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: { ...formData.getHeaders(), "X-Api-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 25000,
      validateStatus: (s) => s < 500,
    });

    if (response.status === 200) return Buffer.from(response.data);
    return null;
  } catch {
    return null;
  }
}

async function callRemoveBgWithUrl(imageUrl: string, apiKey: string): Promise<Buffer | null> {
  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("size", "auto");
    formData.append("type", "product");
    formData.append("format", "png");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: { ...formData.getHeaders(), "X-Api-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 25000,
      validateStatus: (s) => s < 500,
    });

    if (response.status === 200) return Buffer.from(response.data);
    return null;
  } catch {
    return null;
  }
}

export async function removeBg(input: string, isUrl = false) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  const toDataUri = (buffer: Buffer, type = "image/png") =>
    `data:${type};base64,${buffer.toString("base64")}`;

  if (!isUrl || !input.startsWith("http")) {
    if (input.startsWith("data:")) {
      const parts = input.split(",");
      const raw = Buffer.from(parts[1], "base64");
      if (!apiKey) {
        const normalized = await trimWhiteAndNormalize(raw);
        return { cleanImage: toDataUri(normalized) };
      }
      const result = await callRemoveBgWithFile(raw, apiKey);
      if (result) {
        const padded = await padAndCenter(result);
        return { cleanImage: toDataUri(padded) };
      }
      const normalized = await trimWhiteAndNormalize(raw);
      return { cleanImage: toDataUri(normalized) };
    }
    return { cleanImage: input };
  }

  if (!apiKey) {
    // No API key — try to download and trim white background locally
    try {
      const res = await axios.get(input, {
        responseType: "arraybuffer",
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const normalized = await trimWhiteAndNormalize(Buffer.from(res.data));
      return { cleanImage: toDataUri(normalized) };
    } catch {
      return { cleanImage: input };
    }
  }

  // Strategy 1: Try sending URL directly to remove.bg (works when CDN allows it)
  const byUrl = await callRemoveBgWithUrl(input, apiKey);
  if (byUrl) {
    const padded = await padAndCenter(byUrl);
    return { cleanImage: toDataUri(padded) };
  }

  // Strategy 2: Download the image ourselves and send as file
  let rawBuffer: Buffer | null = null;
  try {
    const res = await axios.get(input, {
      responseType: "arraybuffer",
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.google.com/",
      },
    });
    rawBuffer = Buffer.from(res.data);
  } catch {
    // can't download — return original URL as-is
    return { cleanImage: input };
  }

  const byFile = await callRemoveBgWithFile(rawBuffer, apiKey);
  if (byFile) {
    const padded = await padAndCenter(byFile);
    return { cleanImage: toDataUri(padded) };
  }

  // Strategy 3: Local white-trim normalization as last resort
  const normalized = await trimWhiteAndNormalize(rawBuffer);
  return { cleanImage: toDataUri(normalized) };
}
