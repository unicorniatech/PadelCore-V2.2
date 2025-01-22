export type ErrorType = 'CONNECTION_LOST' | 'FRAME_CORRUPT' | 'PROCESSING_TIMEOUT';

export interface StreamError {
  type: ErrorType;
  message: string;
  timestamp: string;
  details?: any;
}

export class ErrorHandler {
  private errorListeners: ((error: StreamError) => void)[] = [];
  private recoveryAttempts: number = 0;

  onError(callback: (error: StreamError) => void) {
    this.errorListeners.push(callback);
  }

  handleError(type: ErrorType, message: string, details?: any) {
    const error: StreamError = {
      type,
      message,
      timestamp: new Date().toISOString(),
      details,
    };

    this.errorListeners.forEach(listener => listener(error));
    this.recoveryAttempts++;

    return error;
  }

  async getRecoveryAttempts(): Promise<number> {
    return this.recoveryAttempts;
  }

  resetRecoveryAttempts() {
    this.recoveryAttempts = 0;
  }
}