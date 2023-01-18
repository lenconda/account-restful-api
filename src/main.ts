import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

const remixEnv = () => {
    if (typeof process.env.NODE_ENV !== 'string') {
        return;
    }

    const modeSpecifiedEnv = dotenv.config({
        path: path.join(process.cwd(), `.env.${process.env.NODE_ENV.toLowerCase()}`),
    });

    Object.assign(process.env, {
        ...(modeSpecifiedEnv?.parsed || {}),
    });
};

async function bootstrap() {
    remixEnv();
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get<ConfigService>(ConfigService);
    app.setGlobalPrefix('/api/v1');
    app.setBaseViewsDir(path.join(__dirname, '..', 'templates'));
    app.setViewEngine('ejs');
    app.enableCors();
    await app.listen(
        configService.get<number>('app.port'),
        configService.get<string>('app.host'),
    );
}
bootstrap();
