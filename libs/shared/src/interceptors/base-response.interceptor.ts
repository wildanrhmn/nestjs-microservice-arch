import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                let baseResponse = {}

                if (data.error) {
                    baseResponse = {
                        success: false,
                        statusCode: data.error?.statusCode,
                        timestamp: new Date().toISOString(),
                        message: data.error?.message,
                    }
                    
                } else {
                    baseResponse = {
                        success: true,
                        statusCode: context.switchToHttp().getResponse().statusCode,
                        timestamp: new Date().toISOString(),
                        message: data.message,
                        data: data.result,
                        meta: data.meta,
                    }
                }
                return baseResponse;
            }),
        );
    }
}