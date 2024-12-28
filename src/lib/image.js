import sharp from "sharp";

// The maximum size for an image, in bytes (256KB)
export const MAX_IMAGE_SIZE = 1024 * 256;

/**
 * Descales an image to MAX_IMAGE_SIZE, leaving smaller images untouched and maintaining the aspect ratio.
 * @param {Buffer} imageBuffer The buffer containing the image pixel data
 */
export const descaleImage = async (imageBuffer) => {
  // If the image is smaller than MAX_IMAGE_SIZE
  if (imageBuffer.length < MAX_IMAGE_SIZE) {
    // Return the unmodified image
    return imageBuffer;
  }

  // Set the scale to 1
  let scale = 1;

  // Decrease the scale until the image size is less than MAX_IMAGE_SIZE
  while (imageBuffer.length * (scale ** 2) > MAX_IMAGE_SIZE) {
    scale -= 0.75;
  }

  // Get the image width and height
  const imageMetadata = await sharp(imageBuffer).metadata();
  const iWidth = Math.floor(imageMetadata.width * scale);
  const iHeight = Math.floor(imageMetadata.height * scale);

  // Resize the image
  const newImageBuffer = await sharp(imageBuffer).resize({
    width: iWidth,
    height: iHeight,
  }).toBuffer();

  // Return the new image
  return newImageBuffer;
}