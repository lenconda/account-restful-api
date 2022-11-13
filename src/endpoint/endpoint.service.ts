import {
    AccessToken,
    FusionAuthClient,
} from '@fusionauth/typescript-client';
import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ERR_AUTH_CLIENT_NOT_FOUND,
    ERR_AUTH_INVALID_GRANT,
} from 'src/app.constants';
import { UserService } from 'src/user/user.service';
import * as _ from 'lodash';
import { AuthService } from 'src/auth/auth.service';
import axios from 'axios';
import * as qs from 'qs';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class EndpointService {
    public constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
    ) {}

    /**
     * refresh access token use refresh token
     * @param {string} refreshToken refresh token content
     * @param {string} clientId auth client id
     * @returns {Promise<TokenResponse>} refresh token response
     */
    public async refreshClientAccessTokenByRefreshToken(refreshToken: string, clientId: string) {
        const oauth2Client = this.authService.getOAuth2Client();

        const clientSecret = await oauth2Client
            .retrieveApplication(clientId)
            .then((response) => response.response?.application?.oauthConfiguration?.clientSecret);


        if (!clientSecret) {
            throw new InternalServerErrorException(ERR_AUTH_CLIENT_NOT_FOUND);
        }

        const result = oauth2Client
            .exchangeRefreshTokenForAccessToken(
                refreshToken,
                clientId,
                clientSecret,
                'offline_access',
                null,
            )
            .then((response) => {
                const {
                    access_token,
                    refresh_token,
                    expires_in,
                } = response.response;
                return {
                    access_token,
                    refresh_token,
                    expires_in,
                };
            });

        return result;
    }

    public async getUserProfileForClient(id: string, apiKey: string) {
        const client = new FusionAuthClient(
            apiKey,
            `${this.configService.get('auth.protocol').toLowerCase()}://${this.configService.get('auth.domain')}`,
        );

        const userInfo = await client
            .retrieveUser(id)
            .then((response) => response.response.user);

        return this.authService.getUserDTOFromOAuth2ServerResponse(userInfo);
    }

    public async exchangeClientAccessTokenFromCode(code: string, clientId?: string) {
        const ltacClientId = this.configService.get('auth.clientId');
        let clientSecret: string;

        if (!clientId || ltacClientId === clientId) {
            clientSecret = this.configService.get('auth.clientSecret');
        } else {
            const application = await this.authService
                .getOAuth2Client()
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
            } = await axios.post<any>(
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

            const {
                expires_in: expiresIn,
                access_token: accessToken,
                refresh_token: refreshToken,
                scope,
                token_type: tokenType,
                userId,
            } = oauth2TokenResponseData;

            return {
                accessToken,
                refreshToken,
                expiresIn,
                scope,
                userId,
                tokenType,
            } as AccessToken;
        } catch (e) {
            throw new InternalServerErrorException(ERR_AUTH_INVALID_GRANT, e.message || e.toString());
        }
    }
}
