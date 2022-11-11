import {
    Controller,
    Get,
    Inject,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDTO } from 'src/user/dto/user.dto';
import { CurrentUser } from 'src/user/user.decorator';
import { AuthService } from './auth.service';

@Controller('/auth')
export class AuthController {
    @Inject()
    protected authService: AuthService;

    @UseGuards(AuthGuard())
    @Get('/token/refresh')
    public refreshToken(@CurrentUser() user: UserDTO) {
        return this.authService.generateNewToken(user.id);
    }
}
