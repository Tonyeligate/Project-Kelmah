#!/usr/bin/env node

const path = require('path');
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User } = require('../shared/models');
const {
  uploadBuffer,
  toMediaAsset,
  hasCloudinaryConfig,
} = require('../shared/utils/cloudinary');

const ROOT_DIR = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(ROOT_DIR, '..');

[
  path.join(ROOT_DIR, '.env'),
  path.join(ROOT_DIR, 'services', 'user-service', '.env'),
  path.join(ROOT_DIR, 'api-gateway', '.env'),
].forEach((envPath) => {
  dotenv.config({ path: envPath, override: false });
});

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.USER_MONGO_URI ||
  process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Missing MongoDB connection string in backend environment files.');
  process.exit(1);
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const forceOverwrite = args.includes('--force');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const roleArg = args.find((arg) => arg.startsWith('--role='));
const roleFilter = roleArg ? roleArg.split('=')[1] : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchCache = new Map();
const imageInfoCache = new Map();

const TRADE_QUERY_MAP = [
  { match: /project\s*owner|project\s*manager|contractor|foreman|developer|site\s*manager/i, keyword: 'construction worker' },
  { match: /electrical|electric/i, keyword: 'electrician' },
  { match: /plumb/i, keyword: 'plumber' },
  { match: /carpent|wood/i, keyword: 'carpenter' },
  { match: /paint|decor/i, keyword: 'painter' },
  { match: /mason|brick|stone/i, keyword: 'mason' },
  { match: /roof/i, keyword: 'construction worker' },
  { match: /weld|metal/i, keyword: 'welder' },
  { match: /tile|floor/i, keyword: 'mason' },
  { match: /hvac|air\s*condition|air-conditioning|climate|refrigeration/i, keyword: 'electrician' },
  { match: /landscap|garden/i, keyword: 'gardener' },
  { match: /construct|builder/i, keyword: 'construction worker' },
  { match: /maintenance|handyman/i, keyword: 'handyman' },
];

const CURATED_COMMONS_TITLES = {
  hirer: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Mason on the scaffold in Accra.jpg',
    'File:Carpenter Ghana.jpg',
    'File:Welder in Ghana.jpg',
  ],
  worker: [
    'File:Ghanaian carpenter.jpg',
    'File:Welder in Ghana.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
    'File:Plumber 01.jpg',
  ],
  admin: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Carpenter Ghana.jpg',
  ],
  staff: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Carpenter Ghana.jpg',
  ],
  electrician: [
    'File:Electrician 01.jpg',
    'File:Electrician 02.jpg',
    'File:NMCB 1 Ghana School House (8708263).jpg',
  ],
  plumber: [
    'File:Plumber 01.jpg',
    'File:Ghanaian Construction Workers.jpg',
  ],
  carpenter: [
    'File:Carpenter Ghana.jpg',
    'File:Ghanaian carpenter.jpg',
    'File:Carpenter 1.jpg',
    'File:Carpenter 2.jpg',
  ],
  painter: [
    'File:A home painter at work.jpg',
    'File:Awanle Ayiboro Hawa Ali 2025 BHO-2467.jpg',
    'File:Artist in Ghana 3.jpg',
  ],
  mason: [
    'File:Mason in Ghana 2.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
    'File:A Mason preparing mortar in Northern Ghana for building.jpg',
    'File:A woman mason in northern Ghana 01.jpg',
  ],
  builder: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Mason on the scaffold in Accra.jpg',
    'File:Carpenter Ghana.jpg',
  ],
  welder: [
    'File:Welder in Ghana.jpg',
    'File:A welder using his tool to create an item.jpg',
    'File:A welder at work joining two pieces of metal together.jpg',
    'File:A welder at work welding a metal together (1).jpg',
  ],
  artisan: [
    'File:Ghanaian carpenter.jpg',
    'File:Plumber 01.jpg',
    'File:Welder in Ghana.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
  ],
  technician: [
    'File:Electrician 01.jpg',
    'File:Plumber 01.jpg',
    'File:Ghanaian Construction Workers.jpg',
  ],
  gardener: [
    'File:Making a garden using garden sticks in Northern Ghana 04.jpg',
    'File:Making a garden using garden sticks in Northern Ghana 03.jpg',
    'File:Making a garden using garden sticks in Northern Ghana 02.jpg',
    'File:Making a garden using garden sticks in Northern Ghana 01.jpg',
  ],
  'construction worker': [
    'File:Ghanaian Construction Workers.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
    'File:Welder in Ghana.jpg',
  ],
  handyman: [
    'File:Ghanaian carpenter.jpg',
    'File:Plumber 01.jpg',
    'File:Welder in Ghana.jpg',
  ],
};

const GENERIC_COMMONS_TITLES = {
  hirer: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Mason on the scaffold in Accra.jpg',
    'File:Carpenter Ghana.jpg',
  ],
  worker: [
    'File:Ghanaian carpenter.jpg',
    'File:Welder in Ghana.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
  ],
  admin: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Carpenter Ghana.jpg',
  ],
  staff: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Carpenter Ghana.jpg',
  ],
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'user';

const hashString = (value = '') =>
  Array.from(String(value)).reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7);

const deriveTradeKeyword = (user) => {
  const candidates = [
    user?.profession,
    ...(Array.isArray(user?.specializations) ? user.specializations : []),
    ...(Array.isArray(user?.skills) ? user.skills : []),
  ].filter(Boolean);

  const combined = candidates.join(' ');

  for (const entry of TRADE_QUERY_MAP) {
    if (entry.match.test(combined)) {
      return entry.keyword;
    }
  }

  if (user?.role === 'hirer') return 'construction worker';
  if (user?.role === 'staff' || user?.role === 'admin') return 'artisan';
  return 'artisan';
};

const getCuratedTitlesForUser = (user, tradeKeyword) => {
  const role = user?.role || 'worker';
  const tradeTitles = CURATED_COMMONS_TITLES[tradeKeyword] || [];
  const roleTitles = CURATED_COMMONS_TITLES[role] || [];
  const titles = [...tradeTitles, ...roleTitles];

  return Array.from(new Set(titles.filter(Boolean)));
};

const buildQueriesForUser = (user, tradeKeyword = deriveTradeKeyword(user)) => {
  const locationKeyword = user?.city || user?.state || user?.location || 'Ghana';
  const role = user?.role || 'worker';

  if (role === 'hirer') {
    return [
      `ghanaian ${tradeKeyword} at work`,
      `ghana construction worker portrait`,
      `ghanaian construction workers`,
      `ghana artisan portrait`,
      `${locationKeyword} construction worker`,
      `ghana builder portrait`,
    ];
  }

  if (role === 'admin' || role === 'staff') {
    return [
      `ghana artisan portrait`,
      `ghanaian construction workers`,
      `ghana builder portrait`,
      `${locationKeyword} artisan portrait`,
    ];
  }

  return [
    `ghanaian ${tradeKeyword}`,
    `ghanaian ${tradeKeyword} at work`,
    `ghanaian ${tradeKeyword} portrait`,
    `ghana ${tradeKeyword} portrait`,
    `ghanaian artisan portrait`,
    `ghana ${tradeKeyword} worker`,
    `ghana ${tradeKeyword} at work`,
    `ghana worker portrait`,
    `ghana professional portrait`,
    `ghana artisan portrait`,
  ];
};

const scoreCommonsResult = (result, query) => {
  const haystack = `${result?.title || ''} ${result?.excerpt || ''}`.toLowerCase();
  let score = 0;

  if (/\.jpe?g$|\.png$/i.test(result?.title || '')) score += 5;
  if (haystack.includes('ghana')) score += 5;
  if (haystack.includes('portrait')) score += 3;
  if (haystack.includes('worker')) score += 2;
  if (haystack.includes('artisan') || haystack.includes('craft')) score += 4;
  if (haystack.includes('construction') || haystack.includes('wiring') || haystack.includes('welding') || haystack.includes('repair') || haystack.includes('scaffold')) score += 4;
  if (haystack.includes('business')) score -= 2;
  if (haystack.includes('person') || haystack.includes('people') || haystack.includes('man') || haystack.includes('woman')) score += 3;
  if (haystack.includes('electrician') || haystack.includes('plumber') || haystack.includes('carpenter') || haystack.includes('welder') || haystack.includes('mason')) score += 2;
  if (haystack.includes('at work') || haystack.includes('working')) score += 4;
  if (haystack.includes(query.toLowerCase().split(' ')[1] || '')) score += 2;
  if (haystack.includes('entrepreneur') || haystack.includes('mogul') || haystack.includes('award winning') || haystack.includes('politician') || haystack.includes('performing') || haystack.includes('makeup')) score -= 8;
  if (haystack.includes('house') || haystack.includes('building') || haystack.includes('truck') || haystack.includes('bus') || haystack.includes('trotro') || haystack.includes('school') || haystack.includes('street') || haystack.includes('beach') || haystack.includes('landscape') || haystack.includes('decor')) score -= 6;
  if (/\.svg$|\.gif$|\.webm$|\.pdf$/i.test(result?.title || '')) score -= 10;

  return score;
};

const getJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'KelmahMediaBackfill/1.0 (profile image refresh)',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
};

const getBuffer = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'KelmahMediaBackfill/1.0 (profile image refresh)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while downloading ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: response.headers.get('content-type') || 'image/jpeg',
  };
};

const searchCommons = async (query) => {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  const url = `https://commons.wikimedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=8`;
  const json = await getJson(url);
  const pages = Array.isArray(json?.pages) ? json.pages : [];
  const filtered = pages
    .filter((page) => page?.thumbnail?.mimetype?.startsWith('image/'))
    .filter((page) => /\.jpe?g$|\.png$/i.test(page?.title || ''))
    .sort((a, b) => scoreCommonsResult(b, query) - scoreCommonsResult(a, query));

  searchCache.set(query, filtered);
  return filtered;
};

const getCommonsImageInfo = async (title) => {
  if (imageInfoCache.has(title)) {
    return imageInfoCache.get(title);
  }

  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title,
  )}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
  const json = await getJson(url);
  const pageEntry = Object.values(json?.query?.pages || {})[0];
  const imageInfo = pageEntry?.imageinfo?.[0] || null;
  imageInfoCache.set(title, imageInfo);
  return imageInfo;
};

const buildCandidateFromTitle = async (title, query) => {
  const imageInfo = await getCommonsImageInfo(title);
  const downloadUrl = imageInfo?.thumburl || imageInfo?.url;
  if (!downloadUrl) return null;

  return {
    query,
    title,
    excerpt: 'Curated Wikimedia Commons trade image',
    sourcePageKey: title.replace(/\s+/g, '_'),
    thumbnailUrl: imageInfo?.thumburl || imageInfo?.url || null,
    downloadUrl,
  };
};

const pickCandidateForUser = (user, results = []) => {
  if (!results.length) return null;
  const pool = results.slice(0, Math.min(results.length, 4));
  const seed = user?.email || user?._id || `${user?.firstName || ''}${user?.lastName || ''}`;
  return pool[hashString(seed) % pool.length];
};

const orderTitlesForUser = (user, titles = []) => {
  if (!titles.length) return [];
  const seed = user?.email || user?._id || `${user?.firstName || ''}${user?.lastName || ''}`;
  const offset = hashString(seed) % titles.length;
  return [...titles.slice(offset), ...titles.slice(0, offset)];
};

const findBestImageCandidate = async (user) => {
  const tradeKeyword = deriveTradeKeyword(user);
  const curatedTitles = getCuratedTitlesForUser(user, tradeKeyword);

  for (const title of curatedTitles) {
    const candidate = await buildCandidateFromTitle(title, `curated:${tradeKeyword}`);
    if (candidate) {
      return candidate;
    }
  }

  const queries = buildQueriesForUser(user, tradeKeyword);

  for (const query of queries) {
    const results = await searchCommons(query);
    const result = pickCandidateForUser(user, results);
    if (!result) continue;

    const imageInfo = await getCommonsImageInfo(result.title);
    const downloadUrl = imageInfo?.thumburl || imageInfo?.url || result?.thumbnail?.url;
    if (!downloadUrl) continue;

    return {
      query,
      title: result.title,
      excerpt: result.excerpt || '',
      sourcePageKey: result.key,
      thumbnailUrl: result?.thumbnail?.url || null,
      downloadUrl,
    };
  }

  const role = user?.role || 'worker';
  const fallbackTitles = GENERIC_COMMONS_TITLES[role] || GENERIC_COMMONS_TITLES.worker;
  for (const fallbackTitle of orderTitlesForUser(user, fallbackTitles)) {
    const fallbackInfo = await getCommonsImageInfo(fallbackTitle);
    const fallbackDownloadUrl = fallbackInfo?.thumburl || fallbackInfo?.url;

    if (fallbackDownloadUrl) {
      return {
        query: `fallback-${role}`,
        title: fallbackTitle,
        excerpt: 'Role-based Wikimedia Commons fallback',
        sourcePageKey: fallbackTitle.replace(/\s+/g, '_'),
        thumbnailUrl: fallbackDownloadUrl,
        downloadUrl: fallbackDownloadUrl,
      };
    }
  }

  return null;
};

const uploadCandidateToCloudinary = async (user, candidate) => {
  const { buffer, mimeType } = await getBuffer(candidate.downloadUrl);
  const uploadResult = await uploadBuffer({
    buffer,
    folder: 'profile-pictures/ghana-backfill',
    mimeType,
    filename: `${slugify(user.firstName)}-${slugify(user.lastName)}-${user._id}`,
    tags: ['ghana-backfill', String(user.role || 'user')],
    context: {
      userId: String(user._id),
      email: String(user.email || ''),
      source: 'wikimedia-commons',
      sourceTitle: candidate.title,
      searchQuery: candidate.query,
    },
  });

  return toMediaAsset(uploadResult, {
    originalFilename: candidate.title,
    source: 'wikimedia-commons',
    sourceTitle: candidate.title,
    sourcePageKey: candidate.sourcePageKey,
    searchQuery: candidate.query,
    originalSourceUrl: candidate.downloadUrl,
  });
};

const buildDirectSourceAsset = (candidate) => ({
  url: candidate.downloadUrl,
  secureUrl: candidate.downloadUrl,
  thumbnailUrl: candidate.thumbnailUrl,
  publicId: null,
  resourceType: 'image',
  originalFilename: candidate.title,
  bytes: null,
  width: null,
  height: null,
  duration: null,
  format: path.extname(candidate.title).replace('.', '') || 'jpg',
  uploadedAt: new Date(),
  storage: 'remote',
  source: 'wikimedia-commons',
  sourceTitle: candidate.title,
  sourcePageKey: candidate.sourcePageKey,
  searchQuery: candidate.query,
  originalSourceUrl: candidate.downloadUrl,
});

const parseSrvConnectionString = (uri) => {
  const parsed = new URL(uri);
  return {
    username: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    host: parsed.hostname,
    database: parsed.pathname.replace(/^\//, '') || 'kelmah_platform',
    params: parsed.searchParams,
  };
};

const resolveAtlasHostsViaNslookup = (host) => {
  const srvOutput = execFileSync('nslookup', ['-type=SRV', `_mongodb._tcp.${host}`], {
    encoding: 'utf8',
  });
  const txtOutput = execFileSync('nslookup', ['-type=TXT', host], {
    encoding: 'utf8',
  });

  const hosts = Array.from(
    new Set(
      srvOutput
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.toLowerCase().startsWith('svr hostname'))
        .map((line) => line.split('=').pop().trim()),
    ),
  );

  const txtMatch = txtOutput.match(/"([^"]+)"/);
  const extraParams = txtMatch?.[1] || 'authSource=admin';

  return { hosts, extraParams };
};

const buildDirectMongoUriFromSrv = (uri) => {
  const { username, password, host, database, params } = parseSrvConnectionString(uri);
  const { hosts, extraParams } = resolveAtlasHostsViaNslookup(host);
  if (!hosts.length) {
    throw new Error(`Unable to resolve Atlas hosts for ${host}`);
  }

  const mergedParams = new URLSearchParams(extraParams);
  params.forEach((value, key) => {
    mergedParams.set(key, value);
  });
  mergedParams.set('tls', 'true');

  const credentials = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
  return `mongodb://${credentials}${hosts.join(',')}/${database}?${mergedParams.toString()}`;
};

const connect = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
    });
  } catch (error) {
    if (!String(mongoUri).startsWith('mongodb+srv://') || !/querySrv|ENOTFOUND|ECONNREFUSED/i.test(error.message)) {
      throw error;
    }

    const directUri = buildDirectMongoUriFromSrv(mongoUri);
    await mongoose.connect(directUri, {
      serverSelectionTimeoutMS: 30000,
    });
  }
};

const main = async () => {
  console.log(`Mode: ${isDryRun ? 'dry-run' : 'live update'}`);
  console.log(`Cloudinary configured: ${hasCloudinaryConfig() ? 'yes' : 'no (direct Wikimedia URLs fallback)'}`);

  await connect();

  const query = { isActive: { $ne: false } };
  if (roleFilter) {
    query.role = roleFilter;
  }

  let users = await User.find(query)
    .select('firstName lastName email role profession skills specializations city state location profilePicture')
    .sort({ role: 1, createdAt: 1 })
    .lean();

  if (Number.isFinite(limit) && limit > 0) {
    users = users.slice(0, limit);
  }

  console.log(`Users in scope: ${users.length}`);

  const summary = {
    scoped: users.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const user of users) {
    const descriptor = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
    try {
      if (!user?.email && !descriptor.trim()) {
        summary.skipped += 1;
        summary.results.push({ status: 'skipped-anonymous' });
        console.log('SKIP  anonymous/incomplete user record');
        continue;
      }

      if (user.profilePicture && !forceOverwrite) {
        summary.skipped += 1;
        summary.results.push({ email: user.email, status: 'skipped-existing' });
        console.log(`SKIP  ${descriptor} (${user.role}) - already has profile image`);
        continue;
      }

      const candidate = await findBestImageCandidate(user);
      if (!candidate) {
        summary.failed += 1;
        summary.results.push({ email: user.email, status: 'no-image-found' });
        console.log(`MISS  ${descriptor} (${user.role}) - no Commons image found`);
        continue;
      }

      if (isDryRun) {
        summary.updated += 1;
        summary.results.push({
          email: user.email,
          status: 'preview',
          query: candidate.query,
          title: candidate.title,
        });
        console.log(`PREVIEW ${descriptor} (${user.role}) -> ${candidate.title} [${candidate.query}]`);
        continue;
      }

      let asset;
      if (hasCloudinaryConfig()) {
        try {
          asset = await uploadCandidateToCloudinary(user, candidate);
        } catch (uploadError) {
          asset = {
            ...buildDirectSourceAsset(candidate),
            fallbackReason: `cloudinary-upload-failed:${uploadError.message}`,
          };
        }
      } else {
        asset = buildDirectSourceAsset(candidate);
      }

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            profilePicture: asset.url,
            profilePictureMetadata: {
              ...asset,
              refreshedAt: new Date(),
              refreshedBy: 'ghana-user-image-backfill-script',
            },
          },
        },
      );

      summary.updated += 1;
      summary.results.push({
        email: user.email,
        status: 'updated',
        query: candidate.query,
        title: candidate.title,
      });
      console.log(`DONE  ${descriptor} (${user.role}) -> ${candidate.title}`);
      await sleep(250);
    } catch (error) {
      summary.failed += 1;
      summary.results.push({
        email: user.email,
        status: 'failed',
        error: error.message,
      });
      console.log(`FAIL  ${descriptor} (${user.role}) - ${error.message}`);
    }
  }

  console.log('--- Summary ---');
  console.log(JSON.stringify(summary, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch (_) {
      // no-op
    }
  });
