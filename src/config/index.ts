import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const MINUTES_TO_MS = 60 * 1000;
const DEFAULT_WINDOW_MS = 10 * MINUTES_TO_MS;
export default {
  ip_address: process.env.IP_ADDRESS || '127.0.0.1',
  node_env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  google_maps: process.env.GOOGLE_MAPS,

  database: {
    mongodb_uri: process.env.MONGODB_URI as string,
  },

  security: {
    bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
    rateLimit_windowMs: process.env.RATE_LIMIT || DEFAULT_WINDOW_MS,
    rateLimit_max: Number(process.env.RATE_MAX) || 100,
  },

  jwt: {
    secret: process.env.JWT_SECRET as string,
    expire_in: process.env.JWT_EXPIRE_IN || '1d',
    refresh_secret: process.env.JWT_REFRESH_SECRET as string,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  frontend: {
    url: process.env.FRONTEND_URL as string,
    live_url: process.env.FRONTEND_LIVE_URL as string,
  },

  cookies: {
    secure: process.env.SECURE_COOKIES === 'true',
  },

  oauth: {
    google: {
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
    },
    microsoft: {
      client_id: process.env.MICROSOFT_CLIENT_ID as string,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET as string,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI as string,
    },
    yahoo: {
      client_id: process.env.YAHOO_CLIENT_ID as string,
      client_secret: process.env.YAHOO_CLIENT_SECRET as string,
      redirect_uri: process.env.YAHOO_REDIRECT_URI as string,
    },
  },

  ai_services: {
    groq_api_key: process.env.GROQ_API_KEY as string,
    deepseek_api_key: process.env.DEEPSEEK_API_KEY as string,
  },

  email: {
    from: process.env.EMAIL_FROM as string,
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string,
    port: Number(process.env.EMAIL_PORT) || 587,
    host: process.env.EMAIL_HOST as string,
    secure: Number(process.env.EMAIL_PORT) === 465, // Secure for port 465
  },

  admin: {
    email: process.env.ADMIN_EMAIL as string,
    password: process.env.ADMIN_PASSWORD as string,
  },

  payment: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY as string,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET as string,
  },
};
