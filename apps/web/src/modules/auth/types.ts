export type AuthResult = {
  token: string | null;
  result: boolean;
  errors: string[] | null;
};
