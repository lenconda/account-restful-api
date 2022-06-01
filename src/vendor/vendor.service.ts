import {
    FusionAuthClient,
    UserRequest,
} from '@fusionauth/typescript-client';
import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ERR_AUTH_CLIENT_NOT_FOUND,
} from 'src/app.constants';
import { Oauth2Service } from 'src/oauth2/oauth2.service';
import { UserDTO } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';
import * as _ from 'lodash';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class VendorService {
    public constructor(
        private readonly oauth2Service: Oauth2Service,
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
    public async getRefreshedToken(refreshToken: string, clientId: string) {
        const oauth2Client = this.oauth2Service.getClient();

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

    public async getUserDTOFromVendor(id: string, apiKey: string) {
        const client = new FusionAuthClient(
            apiKey,
            `${this.configService.get('auth.protocol').toLowerCase()}://${this.configService.get('auth.domain')}`,
        );

        const userInfo = await client
            .retrieveUser(id)
            .then((response) => response.response.user);

        return this.userService.getUserDTOFromOAuth2ServerResponse(userInfo);
    }

    public async updateUserProfile({
        openId,
        updates,
        apiKey,
        email,
    }: {
        email: string;
        apiKey: string;
        openId: string;
        updates: Partial<Omit<UserDTO, 'id'>>;
    }) {
        const client = new FusionAuthClient(
            apiKey,
            `${this.configService.get('auth.protocol').toLowerCase()}://${this.configService.get('auth.domain')}`,
        );

        const userPatchData: Partial<Omit<UserDTO, 'id'>> = _.pick(
            this.utilService.transformDAOToDTO(updates),
            [
                'fullName',
                'firstName',
                'middleName',
                'lastName',
                'email',
            ],
        );

        const result = await client.updateUser(openId, {
            user: {
                ...userPatchData,
                email: userPatchData.email || email,
            },
            skipVerification: email === userPatchData.email,
        } as UserRequest).then((response) => response.response?.user);

        return result;
    }
}
