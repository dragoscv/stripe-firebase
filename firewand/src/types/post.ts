import { BasicEntity } from './basic';
import { AppUser } from './user';

export interface Post extends BasicEntity {
    title: string;
    content: string;
    author: AppUser;
    publishedAt: Date;
    // ...other post-specific properties...
}
