import { renderHook } from '@testing-library/react-native';
import { useVehicleSearch } from '../lib/hooks/useVehicleSearch';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
    },
}));

describe('useVehicleSearch', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useVehicleSearch());
        expect(result.current.loading).toBe(false);
        expect(result.current.search).toBeDefined();
    });

    // Note: Testing actual rate limiting with timers might require more complex setup with jest.useFakeTimers()
    // This is a basic sanity check for the hook structure.
});
