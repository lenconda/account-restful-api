import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ERR_AUTH_CLIENT_NOT_FOUND,
    ERR_AUTH_INVALID_GRANT,
} from 'src/app.constants';
import * as _ from 'lodash';
import { AuthService } from 'src/auth/auth.service';
import * as ejs from 'ejs';

@Injectable()
export class EndpointService {
    private readonly logger = new Logger(EndpointService.name);

    public constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    public async handleHandoverAuthentication(
        code: string,
        clientId = this.configService.get<string>('auth.clientId'),
    ) {
        const appConfig = this.configService.get('app') || {};
        return {
            ...appConfig,
            code,
            clientId,
        };
    }

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

    public async exchangeClientAccessTokenFromCode(code: string, clientId?: string, inputRedirectUri?: string) {
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
            let redirectUri = inputRedirectUri;

            if (!redirectUri) {
                redirectUri = ejs.render(this.configService.get('auth.redirectUriScheme'), {
                    clientId: clientId || ltacClientId,
                });
            }

            this.logger.log(`OAuth2 exchange, code: ${code}, client ID: ${clientId || ltacClientId}, redirect URI: ${redirectUri}`);

            const result = await this.authService
                .getOAuth2Client()
                .exchangeOAuthCodeForAccessToken(
                    code,
                    clientId || ltacClientId,
                    clientSecret,
                    redirectUri,
                );
            const {
                expires_in: expiresIn,
                access_token: accessToken,
                refresh_token: refreshToken,
                scope,
                token_type: tokenType,
                userId,
            } = result.response;
            const data = {
                accessToken,
                refreshToken,
                expiresIn,
                scope,
                userId,
                tokenType,
            };

            this.logger.log('EXCHANGE:' + JSON.stringify(data));

            return data;
        } catch (e) {
	        this.logger.error('OAuth2 Error: ' + JSON.stringify(e?.exception));
            throw new InternalServerErrorException(ERR_AUTH_INVALID_GRANT, e.message || e.toString());
        }
    }
}
