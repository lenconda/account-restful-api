import {
    Controller,
    Get,
    Inject,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserDTO } from 'src/user/dto/user.dto';
import { CurrentUser } from 'src/user/user.decorator';
import { AuthService } from './auth.service';
import * as qs from 'qs';

@Controller('/auth')
export class AuthController {
    @Inject()
    protected authService: AuthService;

    @Get('/handover')
    public async getExchangeAccessToken(
        @Query('token') token: string,
        @Res() response: Response,
    ) {
        const {
            expiresIn,
            token: exchangedToken,
        } = await this.authService.getExchangedAccessToken(token);
        return response.redirect(`/endpoints/check_in?${qs.stringify({
            access_token: exchangedToken,
            expires_in: expiresIn,
        })}`);
    }

    @UseGuards(AuthGuard())
    @Get('/refresh_token')
    public refreshToken(@CurrentUser() user: UserDTO) {
        return this.authService.generateNewToken(user.openId);
    }

    @Get('/callback')
    public async handleAuthenticationCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Res() response: Response,
    ) {
        const redirectURI = await this.authService.authenticationHandler(code, state);
        return response.redirect(redirectURI);
    }
}
