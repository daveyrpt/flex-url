import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../TextInput';

describe('TextInput', () => {
    test('renders input field', () => {
        render(<TextInput />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('accepts input value', async () => {
        const user = userEvent.setup();
        render(<TextInput />);
        
        const input = screen.getByRole('textbox');
        await user.type(input, 'test input');
        
        expect(input).toHaveValue('test input');
    });

    test('calls onChange when value changes', async () => {
        const user = userEvent.setup();
        const handleChange = jest.fn();
        
        render(<TextInput onChange={handleChange} />);
        
        await user.type(screen.getByRole('textbox'), 'a');
        expect(handleChange).toHaveBeenCalled();
    });
});