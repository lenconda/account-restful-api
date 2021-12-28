import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { Oauth2Module } from 'src/oauth2/oauth2.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        Oauth2Module,
        ConfigModule,
        UserModule,
    ],
    providers: [VendorService],
    controllers: [VendorController],
    exports: [VendorService],
})
export class VendorModule {}
