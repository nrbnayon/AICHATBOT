// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env';
dotenv.config({ path: path.join(process.cwd(), envFile) });

const MINUTES_TO_MS = 60 * 1000;
const DEFAULT_WINDOW_MS = 10 * MINUTES_TO_MS;

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be defined in .env');
}

export default {
  ip_address: process.env.IP_ADDRESS || '127.0.0.1',
  node_env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  google_maps: process.env.GOOGLE_MAPS,

  encryption: {
    key: process.env.ENCRYPTION_KEY,
    salt: process.env.ENCRYPTION_SALT || 'salt',
  },

  database: {
    mongodb_uri: process.env.MONGODB_URI,
  },

  security: {
    bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
    rateLimit_windowMs: Number(process.env.RATE_LIMIT) || DEFAULT_WINDOW_MS,
    rateLimit_max: Number(process.env.RATE_MAX) || 100,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expire_in: process.env.JWT_EXPIRE_IN || '1d',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  frontend: {
    url:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_LIVE_URL
        : process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  cookies: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    path: '/',
    domain:
      process.env.NODE_ENV === 'production'
        ? process.env.COOKIE_DOMAIN
        : undefined,
  },

  oauth: {
    google: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:
        process.env.NODE_ENV === 'production'
          ? process.env.GOOGLE_LIVE_REDIRECT_URI
          : process.env.GOOGLE_REDIRECT_URI,
    },
    microsoft: {
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uri:
        process.env.NODE_ENV === 'production'
          ? process.env.MICROSOFT_LIVE_REDIRECT_URI
          : process.env.MICROSOFT_REDIRECT_URI,
    },
    yahoo: {
      client_id: process.env.YAHOO_CLIENT_ID,
      client_secret: process.env.YAHOO_CLIENT_SECRET,
      redirect_uri: process.env.YAHOO_REDIRECT_URI,
    },
  },

  ai_services: {
    groq_api_key: process.env.GROQ_API_KEY,
    deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  },

  email: {
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    port: Number(process.env.EMAIL_PORT) || 587,
    host: process.env.EMAIL_HOST,
    secure: Number(process.env.EMAIL_PORT) === 465,
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  payment: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  plans: {
    free: {
      name: 'free',
      max_requests_per_day: 100,
      max_tokens_per_request: 1000,
      price: 0,
    },
    basic: {
      name: 'basic',
      max_requests_per_day: 1000,
      max_tokens_per_request: 5000,
      price: 9.99,
    },
    premium: {
      name: 'premium',
      max_requests_per_day: 5000,
      max_tokens_per_request: 10000,
      price: 19.99,
    },
    enterprise: {
      name: 'enterprise',
      max_requests_per_day: 10000,
      max_tokens_per_request: 20000,
      price: 49.99,
    },
  },
};
