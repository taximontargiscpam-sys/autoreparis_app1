import { Alert } from 'react-native';

/**
 * Standardized Error Handler for the application.
 * Logs to console and optionally alerts the user.
 * Future: Hook into Sentry/Crashlytics here.
 */
export const handleError = (error: any, userMessage?: string) => {
    // 1. Log to console (always)
    console.error('[ErrorHandler]', error);

    // 2. Extract meaningful message
    const technicalMessage = error?.message || error?.toString() || 'Unknown error';
    const displayMessage = userMessage
        ? `${userMessage}\n\n(Détails: ${technicalMessage})`
        : `Une erreur est survenue : ${technicalMessage}`;

    // 3. Alert User (if UI feedback is desired)
    // We wrap in setTimeout to avoid blocking UI transitions (like navigation)
    setTimeout(() => {
        Alert.alert('Erreur', displayMessage);
    }, 100);
};

export const logErrorSilent = (error: any, context?: string) => {
    console.error(`[SilentError] ${context || ''}:`, error);
    // TODO: Send to Sentry
};
