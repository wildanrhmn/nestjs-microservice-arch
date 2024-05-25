import { ArgumentsHost, Catch, HttpStatus } from "@nestjs/common";

interface IRPCException {
    statusCode: number;
    message: string;
}

@Catch()
export class AllExceptionsFilter {
    catch(exception: any, host: ArgumentsHost) {
        if ((exception instanceof Error || typeof exception === 'object') &&
            exception != null) {
            const _error = exception as IRPCException;
            const response = host.switchToHttp().getResponse();
            response
                .status(_error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    success: false,
                    statusCode: response.statusCode,
                    timestamp: new Date().toISOString(),
                    path: host.switchToHttp().getRequest().url,
                    message: _error.message
                });
        }
    }
}