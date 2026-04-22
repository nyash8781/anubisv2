const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envFilePath = path.resolve(__dirname, '../../.env');
const exampleFilePath = path.resolve(__dirname, '../../.env.example');

if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else if (fs.existsSync(exampleFilePath)) {
  dotenv.config({ path: exampleFilePath });
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value, fallback = []) {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 5000),
  corsOrigins: toList(process.env.CORS_ORIGINS, ['http://localhost:3000']),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',

  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  resendApiKey: process.env.RESEND_API_KEY || '',

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',

  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKey: process.env.R2_ACCESS_KEY || '',
  r2SecretKey: process.env.R2_SECRET_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',

  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
};

const serviceRequirements = {
  ai_claude: ['anthropicApiKey'],
  supabase: ['supabaseUrl', 'supabaseAnonKey'],
  resend: ['resendApiKey'],
  stripe: ['stripeSecretKey', 'stripeWebhookSecret'],
  twilio: ['twilioAccountSid', 'twilioAuthToken', 'twilioPhoneNumber'],
  r2: ['r2AccountId', 'r2AccessKey', 'r2SecretKey', 'r2BucketName'],
  posthog: ['posthogKey'],
};

function getMissingEnvForService(serviceName) {
  const requirements = serviceRequirements[serviceName] || [];
  return requirements.filter((key) => !env[key]);
}

function isServiceConfigured(serviceName) {
  return getMissingEnvForService(serviceName).length === 0;
}

function assertServiceConfigured(serviceName) {
  const missing = getMissingEnvForService(serviceName);
  if (missing.length > 0) {
    throw new Error(
      `[env] ${serviceName} is not configured. Missing: ${missing.join(', ')}`
    );
  }
}

function getServiceStatus() {
  return {
    ai: {
      provider: 'claude',
      configured: isServiceConfigured('ai_claude'),
    },
    supabase: isServiceConfigured('supabase'),
    resend: isServiceConfigured('resend'),
    stripe: isServiceConfigured('stripe'),
    twilio: isServiceConfigured('twilio'),
    r2: isServiceConfigured('r2'),
    posthog: isServiceConfigured('posthog'),
  };
}

module.exports = {
  env,
  envFilePath,
  exampleFilePath,
  getMissingEnvForService,
  isServiceConfigured,
  assertServiceConfigured,
  getServiceStatus,
};
