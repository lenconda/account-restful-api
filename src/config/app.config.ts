import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    port: process.env.APP_PORT ?? 3000,
    host: process.env.APP_HOST ?? '0.0.0.0',
    domain: process.env.APP_DOMAIN ?? 'account.blitzesty.com',
    logFile: process.env.APP_LOG_FILE ?? './logs/app.log',
}));
