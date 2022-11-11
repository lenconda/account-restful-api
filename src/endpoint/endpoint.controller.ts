import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Patch,
    Param,
} from '@nestjs/common';
import { UserDTO } from 'src/user/dto/user.dto';
import { EndpointService } from './endpoint.service';

@Controller('/endpoint')
export class EndpointController {
    public constructor(
        private readonly endpointService: EndpointService,
    ) {}

    @Get('/handover/:client_id?')
    public async handoverAuthentication(
        @Query('code') code: string,
        @Param('client_id') clientId?: string,
    ) {
        return {};
    }

    @Post('/token/refresh')
    public async getRefreshedToken(
        @Body('refresh_token') refreshToken: string,
        @Body('client_id') clientId: string,
    ) {
        return await this.endpointService.getRefreshedToken(refreshToken, clientId);
    }

    @Get('/profile')
    public async getUserProfileForClient(
        @Query('id') id: string,
        @Query('key') apiKey: string,
    ) {
        return await this.endpointService.getUserProfileForClient(id, apiKey);
    }

    @Patch('/profile')
    public async updateUserProfileForClient(
        @Body('open_id') openId: string,
        @Body('api_key') apiKey: string,
        @Body('email') email: string,
        @Body('updates') updates: Partial<Omit<UserDTO, 'id'>>,
    ) {
        return await this.endpointService.updateUserProfileForClient({
            openId,
            apiKey,
            updates,
            email,
        });
    }
}
