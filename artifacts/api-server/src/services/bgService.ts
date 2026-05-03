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

export async function removeBg(input: string, isUrl = false) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  const toDataUri = (buffer: Buffer, type = "image/png") =>
    `data:${type};base64,${buffer.toString("base64")}`;

  let rawBuffer: Buffer;

  try {
    if (isUrl && input.startsWith("http")) {
      const res = await axios.get(input, {
        responseType: "arraybuffer",
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      rawBuffer = Buffer.from(res.data);
    } else if (isUrl && input.startsWith("data:")) {
      const parts = input.split(",");
      rawBuffer = Buffer.from(parts[1], "base64");
    } else {
      return { cleanImage: input };
    }
  } catch {
    return { cleanImage: input };
  }

  if (!apiKey) {
    const normalized = await trimWhiteAndNormalize(rawBuffer);
    return { cleanImage: toDataUri(normalized) };
  }

  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("image_file", rawBuffer, "image.jpg");
    formData.append("size", "auto");
    formData.append("type", "product");
    formData.append("format", "png");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        headers: { ...formData.getHeaders(), "X-Api-Key": apiKey },
        responseType: "arraybuffer",
        timeout: 25000,
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status !== 200) {
      const normalized = await trimWhiteAndNormalize(rawBuffer);
      return { cleanImage: toDataUri(normalized) };
    }

    const padded = await padAndCenter(Buffer.from(response.data));
    return { cleanImage: toDataUri(padded) };
  } catch {
    const normalized = await trimWhiteAndNormalize(rawBuffer);
    return { cleanImage: toDataUri(normalized) };
  }
}
