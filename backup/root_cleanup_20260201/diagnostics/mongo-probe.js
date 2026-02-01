#!/usr/bin/env node
/**
 * Mongo Probe CLI
 * Pings the Kelmah MongoDB cluster, runs a lightweight insert/delete, and prints structured JSON diagnostics.
 */

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');

const normalizeArgs = () => {
    return process.argv.slice(2).reduce((acc, arg) => {
        if (!arg.startsWith('--')) {
            return acc;
        }

        const [rawKey, rawValue] = arg.slice(2).split('=');
        const key = rawKey.trim();
        const value = typeof rawValue === 'undefined' ? true : rawValue.trim();
        acc[key] = value;
        return acc;
    }, {});
};

const cli = normalizeArgs();

const loadEnvFile = (envPath) => {
    if (!envPath) return;
    const resolved = path.resolve(envPath);
    if (fs.existsSync(resolved)) {
        require('dotenv').config({ path: resolved });
    }
};

if (cli.env) {
    loadEnvFile(cli.env);
} else {
    const defaultEnvPath = path.resolve(__dirname, '../.env');
    loadEnvFile(defaultEnvPath);
}

const resolveMongoUri = () => {
    return (
        cli.uri ||
        process.env.MONGODB_URI ||
        process.env.USER_MONGO_URI ||
        process.env.MONGO_URI ||
        (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb') ? process.env.DATABASE_URL : null)
    );
};

const sanitizeHost = (uri) => {
    if (!uri) return null;
    const withoutCreds = uri.includes('@') ? uri.split('@').pop() : uri;
    const hostPort = withoutCreds.split('/')[0];
    return hostPort;
};

const uri = resolveMongoUri();
if (!uri) {
    console.error('Mongo probe failed: no MongoDB URI supplied via --uri or environment variables.');
    process.exit(1);
}

const timeoutMs = Number(cli.timeout || process.env.MONGO_PROBE_TIMEOUT_MS || 8000);
const databaseName = cli.db || process.env.DB_NAME || 'kelmah_platform';
const collectionName = cli.collection || 'diagnostics_probe';
const skipWrite = cli['skip-write'] === true || cli['skip-write'] === 'true';

const output = {
    timestamp: new Date().toISOString(),
    target: {
        host: sanitizeHost(uri),
        database: databaseName,
        collection: collectionName,
        skipWrite
    },
    options: {
        timeoutMs
    }
};

(async () => {
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: timeoutMs,
        connectTimeoutMS: timeoutMs,
        socketTimeoutMS: Math.max(timeoutMs, 5000),
        retryWrites: true
    });

    try {
        const connectStart = Date.now();
        await client.connect();
        output.connection = {
            ok: true,
            latencyMs: Date.now() - connectStart
        };
    } catch (connectionError) {
        output.connection = {
            ok: false,
            error: connectionError.message,
            code: connectionError.code
        };
        console.log(JSON.stringify({ ...output, success: false }, null, 2));
        process.exit(1);
    }

    try {
        const db = client.db(databaseName);
        const pingStart = Date.now();
        await db.command({ ping: 1 });
        output.ping = {
            ok: true,
            latencyMs: Date.now() - pingStart
        };

        if (!skipWrite) {
            const collection = db.collection(collectionName);
            const doc = {
                _id: new ObjectId(),
                __probe: 'kelmah-mongo-probe',
                createdAt: new Date(),
                salt: Math.random().toString(36).slice(2)
            };

            const insertStart = Date.now();
            await collection.insertOne(doc, { writeConcern: { w: 'majority' } });
            const deleteStart = Date.now();
            await collection.deleteOne({ _id: doc._id });

            output.write = {
                ok: true,
                insertLatencyMs: Date.now() - insertStart,
                deleteLatencyMs: Date.now() - deleteStart,
                documentId: doc._id.toString()
            };
        } else {
            output.write = {
                ok: true,
                skipped: true
            };
        }
    } catch (operationError) {
        output.operationError = {
            message: operationError.message,
            name: operationError.name,
            code: operationError.code
        };
    } finally {
        await client.close();
    }

    output.success = Boolean(
        output.connection?.ok &&
        output.ping?.ok &&
        (skipWrite || output.write?.ok)
    );

    console.log(JSON.stringify(output, null, 2));
    process.exit(output.success ? 0 : 1);
})();
