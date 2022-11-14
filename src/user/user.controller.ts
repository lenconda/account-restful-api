import {
    Body,
    Controller,
    Get,
    Patch,
    Put,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDTO } from './dto/user.dto';
import { CurrentUser } from './user.decorator';
import { UserService } from './user.service';

@Controller('/user')
export class UserController {
    public constructor(
        private readonly userService: UserService,
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('/profile')
    public getUserProfile(@CurrentUser() user) {
        return user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('/profile')
    public async updateUserProfile(
        @CurrentUser() user: UserDTO,
        @Body() userInformation: UserDTO,
    ) {
        return await this.userService.updateUserInformation(
            user.email,
            user.id,
            userInformation,
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('/password')
    public async changeUserPassword(@CurrentUser() user: UserDTO) {
        const email = user.email;
        return await this.userService.changeUserPassword(email);
    }
}
