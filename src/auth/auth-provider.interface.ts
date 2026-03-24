export interface AuthProviderInterface {
  isValid(data: any): Promise<boolean>;
}
