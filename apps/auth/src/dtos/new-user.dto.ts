export class NewUserDTO {
  id: string;
  provider: string;
  providerId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
}