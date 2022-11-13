import {
    Module,
    Global,
} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    providers: [
        JwtStrategy,
        AuthService,
    ],
    exports: [
        PassportModule,
        JwtStrategy,
        AuthService,
    ],
})
export class AuthModule {}
