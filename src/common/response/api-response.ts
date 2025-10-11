export class ApiResponse<T> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errorCode?: string,
  ) {}

  static success<T>(data: T): ApiResponse<T> {
    return new ApiResponse<T>(true, data);
  }

  static error(error: string, errorCode: string): ApiResponse<null> {
    return new ApiResponse<null>(false, null, error, errorCode);
  }
}
