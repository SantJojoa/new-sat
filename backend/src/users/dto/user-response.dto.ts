export class UserResponseDto {
    id: string;
    username: string;
    names: string;
    last_name: string;
    num_id: string;

    email: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    area_id?: string;
    charge?: string;
    user_type_id: string;

    constructor(user: any) {
        this.id = user.id;
        this.username = user.username;
        this.names = user.names;
        this.last_name = user.last_name;
        this.num_id = user.num_id;
        this.email = user.email;
        this.is_active = user.is_active;
        this.created_at = user.created_at;
        this.updated_at = user.updated_at;
        this.area_id = user.area_id;
        this.charge = user.charge;
        this.user_type_id = user.user_type_id;
    }
}


