import { UserEntity } from "@app/shared";

export class ConfirmEmailDTO {
    user: UserEntity;
    token: string;
}