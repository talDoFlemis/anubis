export interface AuthProviderInterface {
  isValid(data: unknown): Promise<boolean>;
}
