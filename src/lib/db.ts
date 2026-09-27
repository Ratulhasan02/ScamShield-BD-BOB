import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "scamshield-bd";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse the connection across hot reloads / serverless invocations
const globalWithMongoose = global as typeof globalThis & { _mongoose?: MongooseCache };

const cache: MongooseCache = globalWithMongoose._mongoose || { conn: null, promise: null };
globalWithMongoose._mongoose = cache;

function getFriendlyConnectionError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  // Wrong username / password
  if (lower.includes("bad auth") || lower.includes("authentication failed") || lower.includes("auth failed")) {
    return new Error(
      "MongoDB authentication failed. Check the username/password in MONGODB_URI and that the Database User still exists in Atlas (Database Access)."
    );
  }
  // DNS / SRV lookup failure — often wrong host, no internet, VPN/DNS blocking
  if (lower.includes("enotfound") || lower.includes("ebadname") || lower.includes("querytxt")) {
    return new Error(
      `Could not resolve your MongoDB Atlas host. Check the hostname in MONGODB_URI and your internet/DNS/VPN connection. Original: ${message}`
    );
  }
  // Most common Atlas case: IP not whitelisted / cluster paused / firewall
  if (
    lower.includes("could not connect to any servers") ||
    lower.includes("serverserverselectionerror") ||
    lower.includes("replicasetnoprimary") ||
    lower.includes("serverselection")
  ) {
    return new Error(
      "Could not reach MongoDB Atlas (ServerSelectionError). Most likely causes: (1) Your current IP is NOT whitelisted in Atlas → Network Access → Add IP Address → 'Allow Access from Anywhere (0.0.0.0/0)' for dev, (2) Cluster is paused, (3) Firewall/VPN is blocking port 27017. Original: " +
        message.slice(0, 500)
    );
  }
  return err instanceof Error ? err : new Error(message);
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env.local file (see .env.example)."
    );
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    // Fail fast in dev (10s) instead of hanging 30s+, reset cache on failure so retries work
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: MONGODB_DB,
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
      })
      .catch((err) => {
        cache.promise = null;
        throw getFriendlyConnectionError(err);
      });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw getFriendlyConnectionError(err);
  }
  return cache.conn;
}

