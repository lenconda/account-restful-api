import { AppModule } from './app.module';
import getSignConfig from './config/sign.config';
import getAppConfig from './config/app.config';
import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
    ExpressAdapter,
    NestExpressApplication,
} from '@nestjs/platform-express';
import { NestFactoryStatic } from '@nestjs/core/nest-factory';

const createKeyPair = (signConfig: ReturnType<typeof getSignConfig>) => {
    const {
        keyPairPathname,
        publicKeyPathname,
        privateKeyPathname,
    } = signConfig;

    const {
        publicKey,
        privateKey,
    } = generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    if (!fs.existsSync(keyPairPathname)) {
        fs.mkdirpSync(keyPairPathname);
    }

    if (!fs.existsSync(publicKeyPathname) || !fs.existsSync(privateKeyPathname)) {
        fs.writeFileSync(publicKeyPathname, publicKey);
        fs.writeFileSync(privateKeyPathname, privateKey);
    }
};

async function bootstrap() {
    createKeyPair(getSignConfig());
    const {
        port,
        host,
    } = getAppConfig();
    const server = new ExpressAdapter();

    const apiFactory = new NestFactoryStatic();
    const apiModule = await apiFactory.create<NestExpressApplication>(AppModule, server);
    apiModule.setGlobalPrefix('/api/v1');
    apiModule.enableCors();
    await apiModule.init();

    await server.listen(port, host);
}
bootstrap();
