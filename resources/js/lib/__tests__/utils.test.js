import { cn } from '../utils';

describe('utils', () => {
    describe('cn', () => {
        test('combines class names', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        test('handles conditional classes', () => {
            expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
        });

        test('handles undefined and null values', () => {
            expect(cn('base', null, undefined, 'valid')).toBe('base valid');
        });
    });
});