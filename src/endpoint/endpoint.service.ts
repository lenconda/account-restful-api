import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ERR_AUTH_CLIENT_NOT_FOUND,
    ERR_AUTH_INVALID_GRANT,
} from 'src/app.constants';
import * as _ from 'lodash';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class EndpointService {
    public constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
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
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: expiresIn,
                } = response.response;
                return {
                    accessToken,
                    refreshToken,
                    expiresIn,
                };
            });

        return result;
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
            const result = await this.authService
                .getOAuth2Client()
                .exchangeOAuthCodeForAccessToken(
                    code,
                    clientId || ltacClientId,
                    clientSecret,
                    this.configService.get('auth.defaultRedirectUri'),
                );

            const {
                expires_in: expiresIn,
                access_token: accessToken,
                refresh_token: refreshToken,
                scope,
                token_type: tokenType,
                userId,
            } = result.response;

            return {
                accessToken,
                refreshToken,
                expiresIn,
                scope,
                userId,
                tokenType,
            };
        } catch (e) {
            throw new InternalServerErrorException(ERR_AUTH_INVALID_GRANT, e.message || e.toString());
        }
    }
}
