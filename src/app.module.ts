import { Module } from '@nestjs/common';
import {
    ConfigModule,
    ConfigService,
} from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ExceptionInterceptor } from './exception.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UtilModule } from './util/util.module';
import { EndpointModule } from './endpoint/endpoint.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

// Application configs
import appConfig from './config/app.config';
import dbConfig from './config/db.config';
import authConfig from './config/auth.config';
import signConfig from './config/sign.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [
                appConfig,
                dbConfig,
                authConfig,
                signConfig,
            ],
        }),
        AuthModule,
        UserModule,
        UtilModule,
        EndpointModule,
        WinstonModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                return {
                    transports: [
                        new winston.transports.Console(),
                        ...(
                            process.env.NODE_ENV !== 'development'
                                ? [
                                    new winston.transports.File({
                                        filename: configService.get<string>('app.logFile'),
                                    }),
                                ]
                                : []
                        ),
                    ],
                    exitOnError: false,
                };
            },
            imports: [ConfigModule],
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ExceptionInterceptor,
        },
    ],
})
export class AppModule {}
