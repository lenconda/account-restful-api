import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    InternalServerErrorException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import {
    catchError,
    map,
} from 'rxjs/operators';
import { ERR_HTTP_SERVER_ERROR } from './app.constants';

export type Response = Record<string, any>;

@Injectable()
export class AppInterceptor<T> implements NestInterceptor<T, Response> {
    public async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<Response>> {
        return next.handle().pipe(
            catchError((e) => {
                if (e instanceof HttpException) {
                    throw e;
                } else {
                    throw new InternalServerErrorException(ERR_HTTP_SERVER_ERROR, e.message || e.toString());
                }
            }),
            map((data) => {
                return data;
            }),
        );
    }
}
