import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { ERR_SIGN_KEY_NOT_FOUND } from 'src/app.constants';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import FusionAuthClient from '@fusionauth/typescript-client';
import * as JwksClient from 'jwks-rsa';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class AuthService {
    private client: FusionAuthClient;


    public constructor(
        private readonly configService: ConfigService,
        private readonly utilService: UtilService,
    ) {
        this.client = new FusionAuthClient(
            this.configService.get('auth.apiKey'),
            `${this.configService.get('auth.protocol').toLowerCase()}://${this.configService.get('auth.domain')}`,
        );
    }

    public getOAuth2Client() {
        return this.client;
    }

    public async validateOauth2AccessToken(
        accessToken: string,
        audience: string | string[],
    ): Promise<jwt.JwtPayload> {
        return new Promise((resolve, reject) => {
            const jwksClient = JwksClient({
                rateLimit: true,
                cache: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${this.configService.get('auth.protocol').toLowerCase()}://${this.configService.get('auth.domain')}/.well-known/jwks.json`,
            });

            jwt.verify(
                accessToken,
                (header, callback) => {
                    jwksClient.getSigningKey(header.kid, (error, key) => {
                        if (error) {
                            reject(error);
                        }

                        try {
                            const signingKey = key.getPublicKey();

                            if (!signingKey) {
                                reject(new Error(ERR_SIGN_KEY_NOT_FOUND));
                            }

                            callback(error, signingKey);
                        } catch (e) {
                            reject(e);
                        }
                    });
                },
                {
                    audience,
                    algorithms: ['HS256'],
                    issuer: this.configService.get('auth.jwtIssuer'),
                },
                (error, payload) => {
                    if (error) {
                        reject(error);
                    }

                    resolve(payload);
                },
            );
        });
    }
}
