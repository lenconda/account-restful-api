import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import {
    ERR_AUTH_CLIENT_NOT_FOUND,
    ERR_AUTH_INVALID_GRANT,
    ERR_AUTH_OPEN_ID_INVALID,
    ERR_AUTH_TOKEN_PARSE_ERROR,
    ERR_SIGN_KEY_NOT_FOUND,
    ERR_SIGN_PAYLOAD_NOT_FOUND,
} from 'src/app.constants';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as jwt from 'jsonwebtoken';
import FusionAuthClient, { AccessToken } from '@fusionauth/typescript-client';
import * as JwksClient from 'jwks-rsa';
import axios from 'axios';
import * as qs from 'qs';
import { UtilService } from 'src/util/util.service';
import { UserDTO } from 'src/user/dto/user.dto';

@Injectable()
export class AuthService {
    private client: FusionAuthClient;
    private allowedUserInfoKeyList = {
        fullName: 'fullName',
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
        id: 'openId',
        email: 'email',
        active: 'active',
        verified: 'verified',
        insertInstant: 'createdAt',
        lastUpdateInstant: 'updatedAt',
        imageUrl: 'imageUrl',
    };


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

    // private signLTACToken(openId: string) {
    //     const privateKey = fs.readFileSync(this.configService.get('sign.privateKeyPathname'));

    //     if (!openId || !privateKey) {
    //         return null;
    //     }

    //     const token = jwt.sign(
    //         {
    //             sub: openId,
    //         },
    //         privateKey,
    //         {
    //             algorithm: 'RS256',
    //             audience: this.configService.get('auth.audience'),
    //             expiresIn: this.configService.get('sign.expiration'),
    //             issuer: this.configService.get('sign.issuer'),
    //         },
    //     );

    //     return token;
    // }

    public getUserDTOFromOAuth2ServerResponse(userInfo: UserDTO) {
        const user = Object.keys(this.allowedUserInfoKeyList).reduce((result, currentKey) => {
            const currentKeyName = this.allowedUserInfoKeyList[currentKey];
            const currentValue = userInfo[currentKey];
            if (!_.isNull(currentValue) || !_.isUndefined(currentValue)) {
                result[currentKeyName] = currentValue;
            }
            return result;
        }, {} as UserDTO);

        if (!user.imageUrl) {
            user.imageUrl = this.utilService.getGravatarUrl(user.email);
        }

        return user;
    }
}
