'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { MongoClient, ObjectId } = require('mongodb');

const cliUriArg = process.argv.find((arg) => arg.startsWith('--uri='));
const MONGODB_URI = cliUriArg ? cliUriArg.replace('--uri=', '') : process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'kelmah_platform';

const buildProjectDirectUriFromSrv = (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) return null;

  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)(\?.*)?$/);
  if (!match) return null;

  const [, user, pass, host, dbName] = match;
  if (host !== 'kelmah-messaging.xyqcurn.mongodb.net') return null;

  const hosts = [
    'ac-monrsuz-shard-00-00.xyqcurn.mongodb.net:27017',
    'ac-monrsuz-shard-00-01.xyqcurn.mongodb.net:27017',
    'ac-monrsuz-shard-00-02.xyqcurn.mongodb.net:27017',
  ].join(',');

  const options = 'authSource=admin&replicaSet=atlas-rtsei5-shard-0&tls=true&retryWrites=true&w=majority';
  return `mongodb://${user}:${pass}@${hosts}/${dbName}?${options}`;
};

const connectWithFallback = async (primaryUri) => {
  const candidateUris = [
    primaryUri,
    process.env.MONGODB_URI_DIRECT,
    buildProjectDirectUriFromSrv(primaryUri),
  ].filter(Boolean);

  const tried = new Set();
  let lastError;

  for (const uri of candidateUris) {
    if (tried.has(uri)) continue;
    tried.add(uri);

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
    try {
      await client.connect();
      return { client, connectedUri: uri };
    } catch (err) {
      lastError = err;
      try { await client.close(); } catch (_) {}
    }
  }

  throw lastError;
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
  if (typeof value === 'object' && value._id && ObjectId.isValid(String(value._id))) {
    return new ObjectId(String(value._id));
  }
  return null;
};

async function run() {
  if (!MONGODB_URI) {
    console.error('❌ Migration failed: MONGODB_URI is not set.');
    console.error('Set MONGODB_URI in kelmah-backend/.env or pass --uri="<mongodb-uri>".');
    process.exitCode = 1;
    return;
  }

  let client;

  try {
    console.log('Connecting to MongoDB...');
    const conn = await connectWithFallback(MONGODB_URI);
    client = conn.client;
    console.log('✅ Connected\n');

    const db = client.db(DB_NAME);
    const messages = db.collection('messages');
    const conversations = db.collection('conversations');

    const missingConversationQuery = {
      $or: [{ conversation: { $exists: false } }, { conversation: null }],
    };

    const totalMissing = await messages.countDocuments(missingConversationQuery);
    console.log(`Messages missing conversation link: ${totalMissing}`);

    if (totalMissing === 0) {
      console.log('Nothing to migrate. All messages already link to a conversation.');
      return;
    }

    let linkedMessages = 0;
    let createdConversations = 0;
    let skippedMessages = 0;
    const touchedConversationIds = new Set();

    const cursor = messages.find(missingConversationQuery, {
      projection: {
        sender: 1,
        recipient: 1,
        relatedJob: 1,
        relatedContract: 1,
        createdAt: 1,
      },
      sort: { createdAt: 1 },
    });

    while (await cursor.hasNext()) {
      const message = await cursor.next();
      const sender = toObjectId(message.sender);
      const recipient = toObjectId(message.recipient);

      if (!sender || !recipient) {
        skippedMessages += 1;
        continue;
      }

      const relatedJob = toObjectId(message.relatedJob);
      const relatedContract = toObjectId(message.relatedContract);

      const strictQuery = {
        participants: { $all: [sender, recipient] },
        ...(relatedJob ? { relatedJob } : {}),
        ...(relatedContract ? { relatedContract } : {}),
      };

      let conversation = await conversations.findOne(strictQuery, { sort: { updatedAt: -1 } });

      if (!conversation && (relatedJob || relatedContract)) {
        conversation = await conversations.findOne(
          { participants: { $all: [sender, recipient] } },
          { sort: { updatedAt: -1 } },
        );
      }

      let conversationId;
      if (!conversation) {
        const now = message.createdAt || new Date();
        const createResult = await conversations.insertOne({
          participants: [sender, recipient],
          unreadCounts: [],
          ...(relatedJob ? { relatedJob } : {}),
          ...(relatedContract ? { relatedContract } : {}),
          status: 'active',
          metadata: {},
          createdAt: now,
          updatedAt: now,
        });
        conversationId = createResult.insertedId;
        createdConversations += 1;
      } else {
        conversationId = conversation._id;
      }

      await messages.updateOne(
        { _id: message._id },
        { $set: { conversation: conversationId } },
      );

      linkedMessages += 1;
      touchedConversationIds.add(String(conversationId));
    }

    for (const conversationIdString of touchedConversationIds) {
      const conversationId = new ObjectId(conversationIdString);
      const latest = await messages
        .find({ conversation: conversationId }, { projection: { _id: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(1)
        .next();

      if (!latest) continue;

      await conversations.updateOne(
        { _id: conversationId },
        {
          $set: { lastMessage: latest._id },
          $max: { updatedAt: latest.createdAt || new Date() },
        },
      );
    }

    console.log('\n✅ Migration complete.');
    console.log(`- Messages linked: ${linkedMessages}`);
    console.log(`- Conversations created: ${createdConversations}`);
    console.log(`- Messages skipped: ${skippedMessages}`);
    console.log(`- Conversations touched: ${touchedConversationIds.size}`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (String(err.message).includes('querySrv') || String(err.message).includes('ECONNREFUSED')) {
      console.error('Hint: this looks like DNS/network access to MongoDB Atlas failing from this machine.');
      console.error('Try one of these:');
      console.error('  1) Confirm internet + DNS is available from this environment');
      console.error('  2) Use a reachable URI via --uri="<mongodb-uri>"');
      console.error('  3) Run this script from your backend host/server where Atlas is reachable');
    }
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.close();
    }
    console.log('\nConnection closed.');
  }
}

run();
