export class NewUserDTO {
  provider: string;
  providerId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
}