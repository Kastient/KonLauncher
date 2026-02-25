const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const { createHash } = require('node:crypto');

const PORT = Math.max(1, Number(process.env.KON_SKIN_SERVICE_PORT || 17845));
const HOST = String(process.env.KON_SKIN_SERVICE_HOST || '0.0.0.0').trim() || '0.0.0.0';
const DATA_ROOT = path.resolve(process.env.KON_SKIN_SERVICE_DATA || path.join(process.cwd(), 'skin-service-data'));
const TOKEN = String(process.env.KON_SKIN_SERVICE_TOKEN || '').trim();

const PROFILES_FILE = path.join(DATA_ROOT, 'profiles.json');
const SKINS_DIR = path.join(DATA_ROOT, 'textures', 'skins');
const CAPES_DIR = path.join(DATA_ROOT, 'textures', 'capes');

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 16);

const normalizeModel = (value) => (String(value || '').toLowerCase() === 'slim' ? 'slim' : 'wide');

const sha1 = (buffer) => createHash('sha1').update(buffer).digest('hex');

const ensureDataDirs = async () => {
  await fsp.mkdir(SKINS_DIR, { recursive: true });
  await fsp.mkdir(CAPES_DIR, { recursive: true });
};

const loadProfiles = async () => {
  try {
    const raw = await fsp.readFile(PROFILES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
    return {};
  }
};

const saveProfiles = async (profiles) => {
  await ensureDataDirs();
  await fsp.writeFile(PROFILES_FILE, `${JSON.stringify(profiles || {}, null, 2)}\n`, 'utf8');
};

const parseJsonBody = async (req, maxBytes = 8 * 1024 * 1024) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large.'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        if (!chunks.length) {
          resolve({});
          return;
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });

const decodePngBase64 = (value, label) => {
  const source = String(value || '').trim();
  if (!source) {
    const error = new Error(`${label} is required.`);
    error.code = 'INVALID_IMAGE';
    throw error;
  }

  const buffer = Buffer.from(source, 'base64');
  if (!buffer.length) {
    const error = new Error(`${label} is invalid.`);
    error.code = 'INVALID_IMAGE';
    throw error;
  }

  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
    const error = new Error(`${label} must be PNG.`);
    error.code = 'INVALID_IMAGE';
    throw error;
  }

  return buffer;
};

const getBaseUrl = (req) => {
  const host = String(req.headers.host || `127.0.0.1:${PORT}`);
  const proto = String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https' ? 'https' : 'http';
  return `${proto}://${host}`;
};

const toPublicProfile = (username, profile, req) => {
  const baseUrl = getBaseUrl(req);
  return {
    username,
    model: normalizeModel(profile?.model),
    updatedAt: profile?.updatedAt || null,
    skinHash: profile?.skinHash || '',
    capeHash: profile?.capeHash || '',
    skinUrl: `${baseUrl}/textures/skins/${encodeURIComponent(username)}.png`,
    capeUrl: profile?.capeFile ? `${baseUrl}/textures/capes/${encodeURIComponent(username)}.png` : ''
  };
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, jsonHeaders);
  res.end(`${JSON.stringify(payload)}\n`);
};

const sendFile = async (res, targetPath) => {
  try {
    const stat = await fsp.stat(targetPath);
    if (!stat.isFile()) {
      sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'File not found.' } });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(targetPath).pipe(res);
  } catch {
    sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'File not found.' } });
  }
};

const isAuthorized = (req) => {
  if (!TOKEN) return true;
  const header = String(req.headers.authorization || '').trim();
  if (!header.toLowerCase().startsWith('bearer ')) return false;
  const token = header.slice(7).trim();
  return token === TOKEN;
};

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      sendJson(res, 400, { ok: false, error: { code: 'INVALID_URL', message: 'Invalid URL.' } });
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, jsonHeaders);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/health') {
      sendJson(res, 200, { ok: true, data: { status: 'ok', now: new Date().toISOString() } });
      return;
    }

    if (req.method === 'GET' && pathname === '/v1/profiles') {
      const profiles = await loadProfiles();
      const list = Object.entries(profiles)
        .map(([username, profile]) => toPublicProfile(username, profile, req))
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
      sendJson(res, 200, { ok: true, profiles: list });
      return;
    }

    const profileMatch = pathname.match(/^\/v1\/profiles\/([A-Za-z0-9_]{1,16})$/);
    if (profileMatch && req.method === 'GET') {
      const username = normalizeUsername(profileMatch[1]);
      const profiles = await loadProfiles();
      const profile = profiles[username];
      if (!profile) {
        sendJson(res, 404, { ok: false, error: { code: 'PROFILE_NOT_FOUND', message: 'Profile was not found.' } });
        return;
      }
      sendJson(res, 200, { ok: true, profile: toPublicProfile(username, profile, req) });
      return;
    }

    if (profileMatch && req.method === 'PUT') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Token is invalid.' } });
        return;
      }

      const username = normalizeUsername(profileMatch[1]);
      if (!username) {
        sendJson(res, 400, { ok: false, error: { code: 'INVALID_USERNAME', message: 'Username is invalid.' } });
        return;
      }

      const body = await parseJsonBody(req);
      const skinBuffer = decodePngBase64(body?.skinBase64, 'skinBase64');
      const capeBuffer = body?.capeBase64 ? decodePngBase64(body.capeBase64, 'capeBase64') : null;
      const now = new Date().toISOString();
      const model = normalizeModel(body?.model);

      await ensureDataDirs();

      const skinFile = `${username}.png`;
      const capeFile = capeBuffer ? `${username}.png` : null;

      await fsp.writeFile(path.join(SKINS_DIR, skinFile), skinBuffer);
      if (capeBuffer) {
        await fsp.writeFile(path.join(CAPES_DIR, capeFile), capeBuffer);
      } else {
        await fsp.rm(path.join(CAPES_DIR, `${username}.png`), { force: true });
      }

      const profiles = await loadProfiles();
      profiles[username] = {
        username,
        model,
        skinFile,
        capeFile,
        skinHash: sha1(skinBuffer),
        capeHash: capeBuffer ? sha1(capeBuffer) : '',
        updatedAt: now
      };
      await saveProfiles(profiles);

      sendJson(res, 200, { ok: true, profile: toPublicProfile(username, profiles[username], req) });
      return;
    }

    if (profileMatch && req.method === 'DELETE') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Token is invalid.' } });
        return;
      }

      const username = normalizeUsername(profileMatch[1]);
      const profiles = await loadProfiles();
      delete profiles[username];
      await saveProfiles(profiles);
      await fsp.rm(path.join(SKINS_DIR, `${username}.png`), { force: true });
      await fsp.rm(path.join(CAPES_DIR, `${username}.png`), { force: true });
      sendJson(res, 200, { ok: true });
      return;
    }

    const skinTextureMatch = pathname.match(/^\/textures\/skins\/([A-Za-z0-9_]{1,16})\.png$/);
    if (req.method === 'GET' && skinTextureMatch) {
      const username = normalizeUsername(skinTextureMatch[1]);
      await sendFile(res, path.join(SKINS_DIR, `${username}.png`));
      return;
    }

    const capeTextureMatch = pathname.match(/^\/textures\/capes\/([A-Za-z0-9_]{1,16})\.png$/);
    if (req.method === 'GET' && capeTextureMatch) {
      const username = normalizeUsername(capeTextureMatch[1]);
      await sendFile(res, path.join(CAPES_DIR, `${username}.png`));
      return;
    }

    sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: {
        code: error?.code || 'SERVER_ERROR',
        message: error?.message || 'Unhandled error.'
      }
    });
  }
});

ensureDataDirs()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`[skin-service] listening on http://${HOST}:${PORT}`);
      console.log(`[skin-service] data: ${DATA_ROOT}`);
      if (TOKEN) {
        console.log('[skin-service] auth: enabled');
      }
    });
  })
  .catch((error) => {
    console.error('[skin-service] failed to start', error);
    process.exitCode = 1;
  });
