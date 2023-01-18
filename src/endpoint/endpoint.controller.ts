import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Param,
    Render,
} from '@nestjs/common';
import { EndpointService } from './endpoint.service';

@Controller('/endpoint')
export class EndpointController {
    public constructor(
        private readonly endpointService: EndpointService,
    ) {}

    @Get('/handover/:client_id?')
    @Render('handover')
    public async handoverAuthentication(
        @Query('code') code: string,
        @Param('client_id') clientId?: string,
    ) {
        return await this.endpointService.handleHandoverAuthentication(code, clientId);
    }

    @Post('/token/exchange')
    public async exchangeClientAccessTokenFromCode(
        @Body('code') code: string,
        @Body('clientId') clientId?: string,
    ) {
        return await this.endpointService.exchangeClientAccessTokenFromCode(code, clientId);
    }

    @Post('/token/refresh')
    public async refreshClientAccessTokenByRefreshToken(
        @Body('refreshToken') refreshToken: string,
        @Body('clientId') clientId: string,
    ) {
        return await this.endpointService.refreshClientAccessTokenByRefreshToken(refreshToken, clientId);
    }
}
