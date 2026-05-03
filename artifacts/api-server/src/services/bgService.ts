import axios from "axios";
import sharp from "sharp";
import { getCachedImage, setCachedImage } from "./firebaseCache";

const REMOVEBG_API = "https://api.remove.bg/v1.0/removebg";

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

function baseParams() {
  return {
    size: "auto",
    type: "auto",
    format: "png",
    semitransparency: "true",
  };
}

async function removeBgByUrl(imageUrl: string, apiKey: string): Promise<Buffer | null> {
  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("image_url", imageUrl);
    Object.entries(baseParams()).forEach(([k, v]) => form.append(k, v));

    const res = await axios.post(REMOVEBG_API, form, {
      headers: { ...form.getHeaders(), "X-Api-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 25000,
      validateStatus: (s) => s < 500,
    });

    return res.status === 200 ? Buffer.from(res.data) : null;
  } catch {
    return null;
  }
}

async function removeBgByFile(buffer: Buffer, apiKey: string): Promise<Buffer | null> {
  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("image_file", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    Object.entries(baseParams()).forEach(([k, v]) => form.append(k, v));

    const res = await axios.post(REMOVEBG_API, form, {
      headers: { ...form.getHeaders(), "X-Api-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 25000,
      validateStatus: (s) => s < 500,
    });

    return res.status === 200 ? Buffer.from(res.data) : null;
  } catch {
    return null;
  }
}

async function removeBgByBase64(b64: string, apiKey: string): Promise<Buffer | null> {
  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    // Use image_file_b64 as per the API docs — avoids binary encoding overhead
    form.append("image_file_b64", b64);
    Object.entries(baseParams()).forEach(([k, v]) => form.append(k, v));

    const res = await axios.post(REMOVEBG_API, form, {
      headers: { ...form.getHeaders(), "X-Api-Key": apiKey },
      responseType: "arraybuffer",
      timeout: 25000,
      validateStatus: (s) => s < 500,
    });

    return res.status === 200 ? Buffer.from(res.data) : null;
  } catch {
    return null;
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.google.com/",
      },
    });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

export async function removeBg(input: string, isUrl = false) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  const toDataUri = (buf: Buffer) => `data:image/png;base64,${buf.toString("base64")}`;

  // --- Handle base64 / data URI inputs (never cached — no stable key) ---
  if (!isUrl || input.startsWith("data:")) {
    const b64 = input.startsWith("data:") ? input.split(",")[1] : null;
    if (!b64) return { cleanImage: input };

    if (!apiKey) {
      const normalized = await trimWhiteAndNormalize(Buffer.from(b64, "base64"));
      return { cleanImage: toDataUri(normalized) };
    }

    const result = await removeBgByBase64(b64, apiKey);
    if (result) {
      const padded = await padAndCenter(result);
      return { cleanImage: toDataUri(padded) };
    }

    const normalized = await trimWhiteAndNormalize(Buffer.from(b64, "base64"));
    return { cleanImage: toDataUri(normalized) };
  }

  // --- Handle http/https URL inputs ---

  // Check Firebase cache first — skip the API entirely if we have a stored result
  const cached = await getCachedImage(input);
  if (cached) {
    return { cleanImage: cached };
  }

  if (!apiKey) {
    const raw = await downloadImage(input);
    if (raw) {
      const normalized = await trimWhiteAndNormalize(raw);
      return { cleanImage: toDataUri(normalized) };
    }
    return { cleanImage: input };
  }

  // Strategy 1: send the URL directly to remove.bg
  const byUrl = await removeBgByUrl(input, apiKey);
  if (byUrl) {
    const padded = await padAndCenter(byUrl);
    const dataUri = toDataUri(padded);
    await setCachedImage(input, dataUri);
    return { cleanImage: dataUri };
  }

  // Strategy 2: download ourselves, send as binary file
  const raw = await downloadImage(input);
  if (!raw) return { cleanImage: input };

  const byFile = await removeBgByFile(raw, apiKey);
  if (byFile) {
    const padded = await padAndCenter(byFile);
    const dataUri = toDataUri(padded);
    await setCachedImage(input, dataUri);
    return { cleanImage: dataUri };
  }

  // Strategy 3: local white-trim normalization as last resort (not cached — no API credit spent)
  const normalized = await trimWhiteAndNormalize(raw);
  return { cleanImage: toDataUri(normalized) };
}
