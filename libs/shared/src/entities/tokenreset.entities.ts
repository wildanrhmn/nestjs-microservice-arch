import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { UserEntity } from "./user.entities";

@Entity('tokenreset')
export class TokenResetEntity {
    @PrimaryColumn()
    userId: string;

    @ManyToOne(() => UserEntity, user => user.id)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({
        nullable: true
    })
    resetToken: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", nullable: true })
    createdAt: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", nullable: true })
    expiredAt: Date;
}