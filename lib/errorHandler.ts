import { Alert } from 'react-native';

const errorLog: Array<{ timestamp: string; context: string; message: string }> = [];
const MAX_ERROR_LOG = 50;

export const handleError = (error: unknown, userMessage?: string) => {
    const technicalMessage = error instanceof Error ? error.message : String(error);
    const displayMessage = userMessage
        ? userMessage
        : 'Une erreur est survenue. Veuillez réessayer.';

    logErrorSilent(error, userMessage || 'user-facing');

    setTimeout(() => {
        Alert.alert('Erreur', displayMessage);
    }, 100);
};

export const logErrorSilent = (error: unknown, context?: string) => {
    const message = error instanceof Error ? error.message : String(error);

    if (__DEV__) {
        console.error(`[Error] ${context || ''}:`, error);
    }

    errorLog.push({
        timestamp: new Date().toISOString(),
        context: context || 'unknown',
        message,
    });

    if (errorLog.length > MAX_ERROR_LOG) {
        errorLog.shift();
    }
};

export const getRecentErrors = () => [...errorLog];
