import { AuthGuard } from '@nestjs/passport';
import {
    Body,
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from 'src/user/user.decorator';
import { UserDTO } from 'src/user/dto/user.dto';

@Controller('/auth')
export class AuthController {
    public constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('/login')
    public async handleLogin(
        @Body('clientId') clientId: string,
        @Body('accessToken') handoverAccessToken: string,
    ) {
        return await this.authService.handleExchangeLogin(clientId, handoverAccessToken);
    }

    @Post('/refresh')
    @UseGuards(AuthGuard('jwt'))
    public async handleRefreshLTACToken(@CurrentUser() user: UserDTO) {
        return this.authService.handleRefreshLTACToken(user.id);
    }
}
