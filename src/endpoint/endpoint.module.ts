import { Module } from '@nestjs/common';
import { EndpointService } from './endpoint.service';
import { EndpointController } from './endpoint.controller';
import { Oauth2Module } from 'src/oauth2/oauth2.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        Oauth2Module,
        ConfigModule,
        UserModule,
    ],
    providers: [EndpointService],
    controllers: [EndpointController],
    exports: [EndpointService],
})
export class EndpointModule {}
