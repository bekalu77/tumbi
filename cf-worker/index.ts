interface Env {
  R2_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Extract the path from the request URL
    const url = new URL(request.url);
    // Remove the leading '/' from the pathname to match R2 object keys
    const objectKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;

    // If the request is for the root, serve an index.html or a default page
    if (objectKey === '' || objectKey === '/') {
      // You might want to serve a default index.html or return a 404
      // For now, let's return a simple message
      return new Response('Welcome to the R2 asset proxy!', { status: 200 });
    }

    try {
      // Fetch the object from R2
      const object = await env.R2_BUCKET.get(objectKey);

      if (!object) {
        return new Response('Not Found', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      console.error('Error fetching object from R2:', error);
      return new Response('Error fetching object', { status: 500 });
    }
  },
};
