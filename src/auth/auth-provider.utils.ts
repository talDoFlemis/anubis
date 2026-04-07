import { AuthProvidersEnum } from './auth-providers.enum';

export function getFirstNonEmailProvider(providers: AuthProvidersEnum[]): AuthProvidersEnum | null {
  return providers.find(provider => provider !== AuthProvidersEnum.email) ?? null;
}

export function getPreferredLoginProvider(
  providers: AuthProvidersEnum[],
): AuthProvidersEnum | null {
  if (providers.includes(AuthProvidersEnum.email)) {
    return AuthProvidersEnum.email;
  }

  return providers[0] ?? null;
}
