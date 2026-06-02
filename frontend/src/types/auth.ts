export interface AppModule {
    id: string;
    name: string;
    path: string;
    icon: string;
    description: string;
    order?: number;
    is_active?: boolean;
}

export interface Permission {
    id: string;
    module_id: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    modules: AppModule;
}

export interface UserType {
    id: string;
    name: string;
    description: string;
    permissions?: Permission[];
}

export interface AreaSummary {
    id: string;
    name: string;
    subdireccion_id?: string;
    subdirecciones?: AreaSummary;
}

export interface AuthUser {
    id: string;
    username: string;
    names: string;
    last_name: string;
    email: string;
    user_type_id: string;
    area_id?: string;
    subdireccion_id?: string;
    user_type?: UserType;
    area?: AreaSummary;
    subdireccion?: AreaSummary;
}

export interface RouteState {
    from?: {
        pathname?: string;
    };
}
