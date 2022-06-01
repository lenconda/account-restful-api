import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Patch,
} from '@nestjs/common';
import { UserDTO } from 'src/user/dto/user.dto';
import { VendorService } from './vendor.service';

@Controller('/vendor')
export class VendorController {
    public constructor(
        private readonly vendorService: VendorService,
    ) {}

    @Post('/refresh_token')
    public async getRefreshedToken(
        @Body('refresh_token') refreshToken: string,
        @Body('client_id') clientId: string,
    ) {
        return await this.vendorService.getRefreshedToken(refreshToken, clientId);
    }

    @Get('/profile')
    public async getVendorUserProfile(
        @Query('id') id: string,
        @Query('key') apiKey: string,
    ) {
        return await this.vendorService.getUserDTOFromVendor(id, apiKey);
    }

    @Patch('/profile')
    public async updateUserProfile(
        @Body('open_id') openId: string,
        @Body('api_key') apiKey: string,
        @Body('email') email: string,
        @Body('updates') updates: Partial<Omit<UserDTO, 'id'>>,
    ) {
        return await this.vendorService.updateUserProfile({
            openId,
            apiKey,
            updates,
            email,
        });
    }
}
