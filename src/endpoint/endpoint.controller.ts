import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Patch,
} from '@nestjs/common';
import { UserDTO } from 'src/user/dto/user.dto';
import { EndpointService } from './endpoint.service';

@Controller('/endpoint')
export class EndpointController {
    public constructor(
        private readonly endpointService: EndpointService,
    ) {}

    @Post('/token/refresh')
    public async getRefreshedToken(
        @Body('refresh_token') refreshToken: string,
        @Body('client_id') clientId: string,
    ) {
        return await this.endpointService.getRefreshedToken(refreshToken, clientId);
    }

    @Get('/profile')
    public async getClientProfile(
        @Query('id') id: string,
        @Query('key') apiKey: string,
    ) {
        return await this.endpointService.getUserProfileForClient(id, apiKey);
    }

    @Patch('/profile')
    public async updateUserProfile(
        @Body('open_id') openId: string,
        @Body('api_key') apiKey: string,
        @Body('email') email: string,
        @Body('updates') updates: Partial<Omit<UserDTO, 'id'>>,
    ) {
        return await this.endpointService.updateUserProfile({
            openId,
            apiKey,
            updates,
            email,
        });
    }
}
