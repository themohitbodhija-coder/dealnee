const objectKeyPattern = /^properties\/[a-zA-Z0-9/-]+\.(png|jpg|jpeg|gif|webp|avif)$/;

export function createPhotoImageHandler({ findPublicImage, signGet }) {
  return async request => {
    const unavailable = status => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
    if (request.method !== 'GET') {
      return new Response(null, { status: 405, headers: { 'Allow': 'GET', 'Cache-Control': 'no-store' } });
    }

    const key = new URL(request.url).searchParams.get('key');
    if (!key || key.length > 1024 || !objectKeyPattern.test(key)) return unavailable(404);

    try {
      const image = await findPublicImage(key);
      if (!image) return unavailable(404);
      const location = await signGet(image.object_key);
      return new Response(null, {
        status: 302,
        headers: { 'Location': location, 'Cache-Control': 'public, max-age=60' },
      });
    } catch {
      return unavailable(503);
    }
  };
}
