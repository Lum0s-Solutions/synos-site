// [[path]].js — streams a members-only image from the PRIVATE R2 bucket
// (binding ISO_BUCKET) AFTER _middleware.js has verified Cloudflare Access.
// The bucket has no public r2.dev / custom-domain access; this gated Function is
// the sole path to the bytes.
//
// Supports HTTP Range so a ~13 GB ISO download is resumable (a dropped transfer
// can restart mid-file with `curl -C -` / a browser's resume) and honours HEAD
// for size probes. Object key = the path after /download/, e.g.
//   GET /download/com/Syn_OS-v111.0.0-churchofmalware-x86_64.iso
//   -> R2 key  com/Syn_OS-v111.0.0-churchofmalware-x86_64.iso

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  if (!env.ISO_BUCKET) {
    return new Response('Download backend not configured (R2 binding ISO_BUCKET missing).', { status: 503 });
  }

  const key = (Array.isArray(params.path) ? params.path.join('/') : String(params.path || '')).replace(/^\/+/, '');
  if (!key || key.includes('..')) return new Response('Bad request', { status: 400 });

  // Parse a single byte-range: "bytes=start-end" | "bytes=start-" | "bytes=-suffix".
  let range;
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (m && (m[1] || m[2])) {
      const start = m[1] ? parseInt(m[1], 10) : undefined;
      const end = m[2] ? parseInt(m[2], 10) : undefined;
      if (start !== undefined && end !== undefined) range = { offset: start, length: end - start + 1 };
      else if (start !== undefined) range = { offset: start };
      else if (end !== undefined) range = { suffix: end };
    }
  }

  const obj = await env.ISO_BUCKET.get(key, { ...(range ? { range } : {}), onlyIf: request.headers });
  if (obj === null) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('content-type', 'application/octet-stream');
  headers.set('content-disposition', `attachment; filename="${key.split('/').pop()}"`);
  headers.set('cache-control', 'private, no-store');

  // No body => an onlyIf precondition (e.g. If-None-Match) matched: 304 Not Modified.
  if (typeof obj.body === 'undefined') {
    return new Response(null, { status: 304, headers });
  }

  const wantBody = request.method === 'GET';
  if (obj.range) {
    const size = obj.size;
    const start = obj.range.offset ?? 0;
    const len = obj.range.length ?? (size - start);
    headers.set('content-range', `bytes ${start}-${start + len - 1}/${size}`);
    headers.set('content-length', String(len));
    return new Response(wantBody ? obj.body : null, { status: 206, headers });
  }

  headers.set('content-length', String(obj.size));
  return new Response(wantBody ? obj.body : null, { status: 200, headers });
}
