import { readFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(request, { params }) {
  const { filename } = await params;
  const decodedFilename = decodeURIComponent(filename || '');
  const extension = path.extname(decodedFilename).toLowerCase();

  if (
    !decodedFilename ||
    path.basename(decodedFilename) !== decodedFilename ||
    !IMAGE_TYPES[extension]
  ) {
    return new Response('Invalid seed image filename', { status: 400 });
  }

  const imagePath = path.join(process.cwd(), 'src', 'seeds', 'images', decodedFilename);

  try {
    const image = await readFile(imagePath);
    return new Response(image, {
      headers: {
        'Content-Type': IMAGE_TYPES[extension],
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Response('Seed image not found', { status: 404 });
    }

    console.error('Seed image route error:', error);
    return new Response('Failed to load seed image', { status: 500 });
  }
}
