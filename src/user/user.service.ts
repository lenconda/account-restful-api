import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { UserDTO } from './dto/user.dto';
import { Oauth2Service } from 'src/oauth2/oauth2.service';
import { UserRequest } from '@fusionauth/typescript-client';
import { ERR_FORGOT_PASSWORD_FLOW_FAILED } from 'src/app.constants';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class UserService {
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
        private readonly oauth2Service: Oauth2Service,
        private readonly utilService: UtilService,
    ) {}

    /**
     * update user information
     * @param {string} openId user open id
     * @param {Partial<UserDTO>} updates the data to be updated
     * @returns {Promise<UserDTO>}
     */
    public async updateUserInformation(email: string, openId: string, updates: Partial<UserDTO>) {
        const userPatchData: Partial<Omit<UserDTO, 'id'>> = _.pick(
            updates,
            [
                'fullName',
                'firstName',
                'middleName',
                'lastName',
                'email',
                'imageUrl',
            ],
        );

        const result = await this.oauth2Service
            .getClient()
            .updateUser(openId, {
                user: {
                    ...userPatchData,
                    email: userPatchData.email || email,
                },
                skipVerification: email === userPatchData.email,
            } as UserRequest)
            .then((response) => response.response?.user);

        return result;
    }

    /**
     * change user password
     * @param {Omit<ResetPasswordOptions, 'connection'>} data change password data
     * @returns {Promise<any} change password result
     */
    public async changeUserPassword(email: string) {
        if (!email || !_.isString(email)) {
            throw new BadRequestException();
        }

        const changePasswordId = await this.oauth2Service
            .getClient()
            .forgotPassword({
                email,
            })
            .then((response) => response.response?.changePasswordId);

        if (!changePasswordId || !_.isString(changePasswordId)) {
            throw new InternalServerErrorException(ERR_FORGOT_PASSWORD_FLOW_FAILED);
        }

        return {
            id: changePasswordId,
        };
    }

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
