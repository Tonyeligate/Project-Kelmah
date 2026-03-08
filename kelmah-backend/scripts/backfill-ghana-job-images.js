#!/usr/bin/env node

const path = require('path');
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Job } = require('../shared/models');
const {
  uploadBuffer,
  toMediaAsset,
  hasCloudinaryConfig,
} = require('../shared/utils/cloudinary');

const ROOT_DIR = path.resolve(__dirname, '..');

[
  path.join(ROOT_DIR, '.env'),
  path.join(ROOT_DIR, 'services', 'job-service', '.env'),
  path.join(ROOT_DIR, 'api-gateway', '.env'),
].forEach((envPath) => {
  dotenv.config({ path: envPath, override: false });
});

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.JOB_MONGO_URI ||
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
const statusArg = args.find((arg) => arg.startsWith('--status='));
const statusFilter = statusArg ? statusArg.split('=')[1] : 'open';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchCache = new Map();
const imageInfoCache = new Map();

const JOB_QUERY_MAP = [
  { match: /plumb|pipe|bathroom|toilet|shower|drain|water main|replumb/i, keyword: 'plumbing' },
  { match: /electrical|electric|solar|wiring|generator|socket|lighting/i, keyword: 'electrical' },
  { match: /carpent|cabinet|wood|furniture|truss|door|window/i, keyword: 'carpentry' },
  { match: /paint|decor|wall finish|coating/i, keyword: 'painting' },
  { match: /weld|metal|gate|fabricat/i, keyword: 'welding' },
  { match: /mason|block|brick|plaster|compound wall|foundation|stone/i, keyword: 'masonry' },
  { match: /tile|tiling|mosaic|terrazzo|epoxy|floor|flooring|grout/i, keyword: 'flooring' },
  { match: /roof/i, keyword: 'roofing' },
  { match: /hvac|air\s*condition|air-conditioning|climate|refrigeration/i, keyword: 'hvac' },
  { match: /garden|landscap|lawn|irrigation|paving/i, keyword: 'landscaping' },
  { match: /interior|fit-out|ceiling|restaurant|design/i, keyword: 'interior design' },
  { match: /handyman|repair|maintenance|renovation/i, keyword: 'general repairs' },
  { match: /swimming pool|pool construction|construction|builder|concrete|excavation/i, keyword: 'construction' },
];

const CURATED_JOB_TITLES = {
  plumbing: [
    'File:Plumber 01.jpg',
    'File:Ghanaian Construction Workers.jpg',
  ],
  electrical: [
    'File:Electrician 01.jpg',
    'File:Electrician 02.jpg',
    'File:NMCB 1 Ghana School House (8708263).jpg',
  ],
  carpentry: [
    'File:Carpenter Ghana.jpg',
    'File:Ghanaian carpenter.jpg',
    'File:Carpenter 1.jpg',
  ],
  painting: [
    'File:A home painter at work.jpg',
    'File:Awanle Ayiboro Hawa Ali 2025 BHO-2467.jpg',
    'File:Artist in Ghana 3.jpg',
  ],
  welding: [
    'File:Welder in Ghana.jpg',
    'File:A welder using his tool to create an item.jpg',
    'File:A welder at work joining two pieces of metal together.jpg',
  ],
  masonry: [
    'File:Mason in Ghana 2.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
    'File:A Mason preparing mortar in Northern Ghana for building.jpg',
  ],
  flooring: [
    'File:Mason in Ghana 2.jpg',
    'File:A mason building a wall in Northern Ghana.jpg',
    'File:Ghanaian Construction Workers.jpg',
  ],
  roofing: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Carpenter Ghana.jpg',
    'File:Mason on the scaffold in Accra.jpg',
  ],
  hvac: [
    'File:Electrician 01.jpg',
    'File:Electrician 02.jpg',
    'File:Ghanaian Construction Workers.jpg',
  ],
  landscaping: [
    'File:Making a garden using garden sticks in Northern Ghana 04.jpg',
    'File:Making a garden using garden sticks in Northern Ghana 03.jpg',
    'File:Making a garden using garden sticks in Northern Ghana 02.jpg',
  ],
  'interior design': [
    'File:Carpenter Ghana.jpg',
    'File:Ghanaian carpenter.jpg',
    'File:Ghanaian Construction Workers.jpg',
  ],
  'general repairs': [
    'File:Ghanaian carpenter.jpg',
    'File:Plumber 01.jpg',
    'File:Electrician 01.jpg',
  ],
  construction: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Mason on the scaffold in Accra.jpg',
    'File:Welder in Ghana.jpg',
  ],
  default: [
    'File:Ghanaian Construction Workers.jpg',
    'File:Carpenter Ghana.jpg',
    'File:Welder in Ghana.jpg',
  ],
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'job';

const hashString = (value = '') =>
  Array.from(String(value)).reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7);

const CATEGORY_KEYWORD_MAP = {
  plumbing: 'plumbing',
  electrical: 'electrical',
  carpentry: 'carpentry',
  construction: 'construction',
  painting: 'painting',
  welding: 'welding',
  masonry: 'masonry',
  hvac: 'hvac',
  roofing: 'roofing',
  flooring: 'flooring',
  tiling: 'flooring',
  landscaping: 'landscaping',
  'interior design': 'interior design',
  'general repairs': 'general repairs',
};

const deriveJobKeyword = (job) => {
  const category = String(job?.category || '');
  const normalizedCategory = slugify(category).replace(/-/g, ' ');
  const title = String(job?.title || '');
  const skills = Array.isArray(job?.skills) ? job.skills.join(' ') : '';
  const description = String(job?.description || '');
  const titleAndSkills = `${title} ${skills}`;

  if (/tile|tiling|mosaic|terrazzo|epoxy|floor|flooring|grout/i.test(titleAndSkills)) {
    return 'flooring';
  }

  if (/garden|landscap|lawn|irrigation|paving/i.test(titleAndSkills)) {
    return 'landscaping';
  }

  if (/swimming pool|pool construction|pool tiling/i.test(titleAndSkills)) {
    return 'construction';
  }

  if (/interior|fit-out|ceiling|restaurant|design/i.test(titleAndSkills) && normalizedCategory === 'interior design') {
    return 'interior design';
  }

  if (CATEGORY_KEYWORD_MAP[normalizedCategory]) {
    return CATEGORY_KEYWORD_MAP[normalizedCategory];
  }

  const combined = `${titleAndSkills} ${description}`;

  for (const entry of JOB_QUERY_MAP) {
    if (entry.match.test(combined)) {
      return entry.keyword;
    }
  }

  return slugify(category).replace(/-/g, ' ') || 'construction';
};

const getCuratedTitlesForJob = (job, keyword) => {
  const categoryKey = String(job?.category || '').trim().toLowerCase();
  const categoryTitles = CURATED_JOB_TITLES[categoryKey] || [];
  const keywordTitles = CURATED_JOB_TITLES[keyword] || [];
  const fallbackTitles = CURATED_JOB_TITLES.default || [];

  return Array.from(new Set([...keywordTitles, ...categoryTitles, ...fallbackTitles].filter(Boolean)));
};

const buildQueriesForJob = (job, keyword) => {
  const locationKeyword = job?.location?.city || job?.locationDetails?.region || 'Ghana';
  const category = String(job?.category || '').trim();
  const title = String(job?.title || '').trim();
  const leadSkill = Array.isArray(job?.skills) && job.skills.length ? String(job.skills[0]).trim() : '';

  return Array.from(new Set([
    `ghana ${keyword} at work`,
    `ghana ${keyword} worker`,
    `ghana ${keyword} construction`,
    category ? `ghana ${category} work` : '',
    leadSkill ? `ghana ${leadSkill} work` : '',
    title ? `ghana ${title}` : '',
    title ? `${title} ghana construction` : '',
    locationKeyword ? `${locationKeyword} ${keyword} ghana` : '',
    category ? `${category} ghana worker` : '',
    'ghana artisan at work',
  ].filter(Boolean)));
};

const scoreCommonsResult = (result, query) => {
  const haystack = `${result?.title || ''} ${result?.excerpt || ''}`.toLowerCase();
  const normalizedQuery = String(query || '').toLowerCase();
  let score = 0;

  if (/\.jpe?g$|\.png$/i.test(result?.title || '')) score += 5;
  if (haystack.includes('ghana')) score += 6;
  if (haystack.includes('work') || haystack.includes('working') || haystack.includes('at work')) score += 5;
  if (haystack.includes('construction') || haystack.includes('repair') || haystack.includes('plumb') || haystack.includes('electric') || haystack.includes('weld') || haystack.includes('mason') || haystack.includes('carpenter') || haystack.includes('paint')) score += 5;
  if (haystack.includes('artisan') || haystack.includes('craft')) score += 3;
  if (haystack.includes('interior') || haystack.includes('floor') || haystack.includes('tile') || haystack.includes('garden') || haystack.includes('roof')) score += 3;
  if (normalizedQuery.split(/\s+/).some((term) => term && term.length > 3 && haystack.includes(term))) score += 3;
  if (haystack.includes('portrait') || haystack.includes('entrepreneur') || haystack.includes('business') || haystack.includes('mogul') || haystack.includes('politician') || haystack.includes('award')) score -= 8;
  if (haystack.includes('logo') || haystack.includes('diagram') || haystack.includes('map') || haystack.includes('flag') || haystack.includes('icon')) score -= 10;
  if (/\.svg$|\.gif$|\.webm$|\.pdf$/i.test(result?.title || '')) score -= 10;

  return score;
};

const getJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'KelmahMediaBackfill/1.0 (job image refresh)',
      Accept: 'application/json',
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
      'User-Agent': 'KelmahMediaBackfill/1.0 (job image refresh)',
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

  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*`;
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

const pickCandidateForJob = (job, results = []) => {
  if (!results.length) return null;
  const pool = results.slice(0, Math.min(results.length, 4));
  const seed = job?._id || job?.title || `${job?.category || ''}${job?.createdAt || ''}`;
  return pool[hashString(seed) % pool.length];
};

const findBestImageCandidate = async (job) => {
  const keyword = deriveJobKeyword(job);
  const curatedTitles = getCuratedTitlesForJob(job, keyword);

  for (const title of curatedTitles) {
    const candidate = await buildCandidateFromTitle(title, `curated:${keyword}`);
    if (candidate) {
      return candidate;
    }
  }

  const queries = buildQueriesForJob(job, keyword);

  for (const query of queries) {
    const results = await searchCommons(query);
    const result = pickCandidateForJob(job, results);
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

  return null;
};

const uploadCandidateToCloudinary = async (job, candidate) => {
  const { buffer, mimeType } = await getBuffer(candidate.downloadUrl);
  const uploadResult = await uploadBuffer({
    buffer,
    folder: 'jobs/covers/ghana-backfill',
    mimeType,
    filename: `${slugify(job.title)}-${job._id}`,
    tags: ['ghana-job-backfill', slugify(job.category || 'job')],
    context: {
      jobId: String(job._id),
      title: String(job.title || ''),
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

  const query = {
    visibility: { $ne: 'private' },
    status: statusFilter ? statusFilter : { $nin: ['draft', 'cancelled'] },
  };

  let jobs = await Job.find(query)
    .select('title description category skills location locationDetails coverImage coverImageMetadata status visibility createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (Number.isFinite(limit) && limit > 0) {
    jobs = jobs.slice(0, limit);
  }

  console.log(`Jobs in scope: ${jobs.length}`);

  const summary = {
    scoped: jobs.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const job of jobs) {
    const descriptor = `${job?.title || 'Untitled job'} (${job?.category || 'Uncategorized'})`;

    try {
      if (job.coverImage && !forceOverwrite) {
        summary.skipped += 1;
        summary.results.push({ title: job.title, status: 'skipped-existing' });
        console.log(`SKIP  ${descriptor} - already has cover image`);
        continue;
      }

      const candidate = await findBestImageCandidate(job);
      if (!candidate) {
        summary.failed += 1;
        summary.results.push({ title: job.title, status: 'no-image-found' });
        console.log(`MISS  ${descriptor} - no Commons image found`);
        continue;
      }

      if (isDryRun) {
        summary.updated += 1;
        summary.results.push({
          title: job.title,
          status: 'preview',
          query: candidate.query,
          imageTitle: candidate.title,
        });
        console.log(`PREVIEW ${descriptor} -> ${candidate.title} [${candidate.query}]`);
        continue;
      }

      let asset;
      if (hasCloudinaryConfig()) {
        try {
          asset = await uploadCandidateToCloudinary(job, candidate);
        } catch (uploadError) {
          asset = {
            ...buildDirectSourceAsset(candidate),
            fallbackReason: `cloudinary-upload-failed:${uploadError.message}`,
          };
        }
      } else {
        asset = buildDirectSourceAsset(candidate);
      }

      await Job.updateOne(
        { _id: job._id },
        {
          $set: {
            coverImage: asset.url,
            coverImageMetadata: {
              ...asset,
              refreshedAt: new Date(),
              refreshedBy: 'ghana-job-image-backfill-script',
            },
          },
        },
      );

      summary.updated += 1;
      summary.results.push({
        title: job.title,
        status: 'updated',
        query: candidate.query,
        imageTitle: candidate.title,
      });
      console.log(`DONE  ${descriptor} -> ${candidate.title}`);
      await sleep(250);
    } catch (error) {
      summary.failed += 1;
      summary.results.push({
        title: job.title,
        status: 'failed',
        error: error.message,
      });
      console.log(`FAIL  ${descriptor} - ${error.message}`);
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
