import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimaryButton from '../PrimaryButton';

describe('PrimaryButton', () => {
    test('renders button with children', () => {
        render(<PrimaryButton>Click me</PrimaryButton>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    test('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = jest.fn();
        
        render(<PrimaryButton onClick={handleClick}>Click me</PrimaryButton>);
        
        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('is disabled when disabled prop is true', () => {
        render(<PrimaryButton disabled>Click me</PrimaryButton>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
});