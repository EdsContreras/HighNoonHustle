import p5 from 'p5';

// Cache for loaded images to prevent loading the same image multiple times
const imageCache: Record<string, p5.Image> = {};

/**
 * Load an image with caching
 */
export async function loadImage(p: p5, path: string): Promise<p5.Image> {
  if (imageCache[path]) {
    return imageCache[path];
  }
  
  return new Promise((resolve, reject) => {
    p.loadImage(
      path,
      (img) => {
        imageCache[path] = img;
        resolve(img);
      },
      () => reject(new Error(`Failed to load image: ${path}`))
    );
  });
}
