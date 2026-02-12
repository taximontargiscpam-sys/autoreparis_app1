import { Alert } from 'react-native';

const errorLog: Array<{ timestamp: string; context: string; message: string }> = [];
const MAX_ERROR_LOG = 50;

export const handleError = (error: any, userMessage?: string) => {
    const technicalMessage = error?.message || error?.toString() || 'Unknown error';
    const displayMessage = userMessage
        ? `${userMessage}\n\n(Détails: ${technicalMessage})`
        : `Une erreur est survenue : ${technicalMessage}`;

    logErrorSilent(error, userMessage || 'user-facing');

    setTimeout(() => {
        Alert.alert('Erreur', displayMessage);
    }, 100);
};

export const logErrorSilent = (error: any, context?: string) => {
    const message = error?.message || error?.toString() || 'Unknown';

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
