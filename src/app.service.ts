import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs-extra';

@Injectable()
export class AppService {
    public constructor(private readonly configService: ConfigService) {
        const signConfig = configService.get<any>('sign');
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
    }
}
