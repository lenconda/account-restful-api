import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import {
    ERR_AUTH_OPEN_ID_INVALID,
    ERR_AUTH_TOKEN_PARSE_ERROR,
    ERR_SIGN_PAYLOAD_NOT_FOUND,
} from 'src/app.constants';
import { ConfigService } from '@nestjs/config';
import { Oauth2Service } from 'src/oauth2/oauth2.service';
import * as fs from 'fs-extra';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    public constructor(
        private readonly configService: ConfigService,
        private readonly oauth2Service: Oauth2Service,
    ) {}

    public signAccountCenterToken(openId: string) {
        const privateKey = fs.readFileSync(this.configService.get('sign.privateKeyPathname'));

        if (!openId || !privateKey) {
            return null;
        }

        const token = jwt.sign(
            {
                sub: openId,
            },
            privateKey,
            {
                algorithm: 'RS256',
                audience: this.configService.get('auth.audience'),
                expiresIn: this.configService.get('sign.expiration'),
                issuer: this.configService.get('sign.issuer'),
            },
        );

        return token;
    }

    /**
     * use Auth0 access token to generate a new token that can be recognized
     * by Lenconda Account Center
     * @param {string} token access token from Auth0 tenants
     * @returns {Promise}
     */
    public async signLTACAccessToken(token: string) {
        if (!token) {
            throw new BadRequestException();
        }

        const [, payload] = token.split('.');
        let audience: string | string[];

        if (!payload) {
            throw new InternalServerErrorException(ERR_SIGN_PAYLOAD_NOT_FOUND);
        }

        try {
            const {
                aud,
            } = JSON.parse(Buffer.from(payload, 'base64').toString()) as jwt.JwtPayload;
            audience = aud;
        } catch (e) {
            throw new InternalServerErrorException(ERR_AUTH_TOKEN_PARSE_ERROR);
        }

        const {
            sub: openId,
        } = await this.oauth2Service.validateOauth2AccessToken(token, audience);

        if (!openId) {
            throw new InternalServerErrorException(ERR_AUTH_OPEN_ID_INVALID);
        }

        return {
            token: this.signAccountCenterToken(openId),
            expiresIn: this.configService.get('sign.expiration'),
        };
    }

    public generateNewToken(openId: string) {
        if (!openId) {
            return {};
        }

        return {
            token: this.signAccountCenterToken(openId),
            expiresIn: this.configService.get('sign.expiration'),
        };
    }
}
