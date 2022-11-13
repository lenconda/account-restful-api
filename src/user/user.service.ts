import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { UserDTO } from './dto/user.dto';
import { UserRequest } from '@fusionauth/typescript-client';
import { ERR_FORGOT_PASSWORD_FLOW_FAILED } from 'src/app.constants';
import { UtilService } from 'src/util/util.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
    public constructor(
        private readonly authService: AuthService,
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

        const result = await this.authService
            .getOAuth2Client()
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

        const changePasswordId = await this.authService
            .getOAuth2Client()
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
}
