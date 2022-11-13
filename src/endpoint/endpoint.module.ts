import { Module } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { EndpointController } from './endpoint.controller';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        ConfigModule,
        UserModule,
        AuthModule,
    ],
    providers: [EndpointService],
    controllers: [EndpointController],
    exports: [EndpointService],
})
export class EndpointModule {}
