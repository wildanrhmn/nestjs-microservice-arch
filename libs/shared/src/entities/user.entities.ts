import { Entity, Column, Unique, PrimaryColumn } from "typeorm";

@Entity('user')
export class UserEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;
    
    @Unique(['email'])
    @Column()
    email: string;

    @Column({
        nullable: true,
    })
    password: string;

    @Column({
        nullable: true,
    })
    phone: string;

    @Column({ default: false })
    isActive: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt: Date;
}