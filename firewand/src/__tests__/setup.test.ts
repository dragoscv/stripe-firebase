import { describe, it, expect } from '@jest/globals';
import { mockUser } from './setup';

describe('Test Setup', () => {
    it('should set up mock user correctly', () => {
        expect(mockUser.uid).toBe('test-user-123');
        expect(mockUser.email).toBe('test@example.com');
    });
});