import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as JwksClient from 'jwks-rsa';
import {
    ERR_AUTH_CLIENT_NOT_FOUND,
    ERR_AUTH_INVALID_GRANT,
    ERR_SIGN_KEY_NOT_FOUND,
} from 'src/app.constants';
import { FusionAuthClient } from '@fusionauth/typescript-client';
import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import axios from 'axios';
import * as qs from 'qs';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class Oauth2Service {
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

    public getClient() {
        return this.client;
    }

    public async validateOauth2AccessToken(
        token: string,
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
                token,
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
                    algorithms: ['RS256'],
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

    public async exchangeAccessTokenFromCode(code: string, clientId: string) {
        const ltacClientId = this.configService.get('auth.clientId');
        let clientSecret: string;

        if (ltacClientId === clientId) {
            clientSecret = this.configService.get('auth.clientSecret');
        } else {
            const application = await this
                .getClient()
                .retrieveApplication(clientId)
                .then((response) => response.response?.application);

            if (!application) {
                throw new InternalServerErrorException(ERR_AUTH_CLIENT_NOT_FOUND);
            }

            clientSecret = application?.oauthConfiguration?.clientSecret;
        }

        if (!clientSecret) {
            throw new InternalServerErrorException(ERR_AUTH_CLIENT_NOT_FOUND);
        }

        try {
            const {
                data: oauth2TokenResponseData,
            } = await axios.post(
                this.configService.get('auth.protocol').toLowerCase() +
                '://' +
                this.configService.get('auth.domain') +
                this.configService.get('auth.tokenEndpoint'),
                qs.stringify(this.utilService.transformSnakeToCamel({
                    code,
                    clientId,
                    clientSecret,
                    grantType: 'authorization_code',
                    redirectUri: this.configService.get('auth.defaultRedirectUri'),
                })),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    responseType: 'json',
                },
            );

            return oauth2TokenResponseData;
        } catch (e) {
            throw new InternalServerErrorException(ERR_AUTH_INVALID_GRANT, e.message || e.toString());
        }
    }
}
