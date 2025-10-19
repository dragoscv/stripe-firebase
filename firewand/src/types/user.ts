import { BasicEntity } from './basic';

export interface AppUser extends BasicEntity {
    name: string;
    email: string;
    // ...other user-specific properties...
}
