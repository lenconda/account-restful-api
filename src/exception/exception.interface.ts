import { ModuleMetadata } from '@nestjs/common';

export interface ExceptionModuleOptions {
    errorCodes?: Enumerator;
}

export interface ExceptionModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useFactory?: (...args: any[]) =>
        | ExceptionModuleOptions
        | ExceptionModuleOptions[]
        | Promise<ExceptionModuleOptions>
        | Promise<ExceptionModuleOptions[]>;
    inject?: any[];
}
