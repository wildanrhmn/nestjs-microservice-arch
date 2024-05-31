import { Entity, Column, Unique, PrimaryColumn } from "typeorm";

@Entity('tokenreset')
export class TokenResetEntity {
    @PrimaryColumn()
    userId: string;

    @Column({
        nullable: true
    })
    resetToken: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", nullable: true })
    createdAt: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", nullable: true })
    expiredAt: Date;
}