import { FastifyRequest } from 'fastify';

export interface UserDetails {
    id: number;
    uuid_auth: string;
    user_details_type: number; // 1: Admin, 2: PT, 3: User (assumed)
    [key: string]: any;
}

export interface User {
    userId: string;
    userRole: number;
    userDetails: UserDetails;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}
