import {
    DynamicModule,
    Global,
    Module,
} from '@nestjs/common';
import { EXCEPTION_MODULE_OPTIONS } from './exception.constants';
import {
    ExceptionModuleAsyncOptions,
    ExceptionModuleOptions,
} from './exception.interface';

@Global()
@Module({})
export class ExceptionModule {
    public static forRoot(options: ExceptionModuleOptions = {}): DynamicModule {
        return {
            module: ExceptionModule,
            providers: [
                {
                    provide: EXCEPTION_MODULE_OPTIONS,
                    useValue: options,
                },
            ],
        };
    }

    public static forRootAsync(options: ExceptionModuleAsyncOptions = {}): DynamicModule {
        return {
            module: ExceptionModule,
            imports: options?.imports || [],
            providers: [
                {
                    provide: EXCEPTION_MODULE_OPTIONS,
                    useFactory: options?.useFactory,
                    inject: options?.inject || [],
                },
            ],
        };
    }
}
