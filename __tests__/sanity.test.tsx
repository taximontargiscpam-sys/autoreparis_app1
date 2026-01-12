import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

describe('Sanity Check', () => {
    it('runs strict equality check', () => {
        expect(1 + 1).toBe(2);
    });

    it('renders a simple component', () => {
        render(<Text>Hello World</Text>);
        expect(screen.getByText('Hello World')).toBeTruthy();
    });
});
