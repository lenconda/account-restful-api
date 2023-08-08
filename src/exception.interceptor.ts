import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    Logger,
} from '@nestjs/common';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type Response = Record<string, any>;

@Injectable()
export class ExceptionInterceptor<T> implements NestInterceptor<T, Response> {
    private logger = new Logger('AppInterceptor');

    public async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<Response>> {
        return next.handle().pipe(
            catchError((e) => {
                this.logger.error(e + e?.stack);
                console.log(e);
                if (e instanceof ClientResponse) {
                    throw new HttpException(e.response, e.statusCode);
                } else {
                    throw e;
                }
            }),
        );
    }
}
