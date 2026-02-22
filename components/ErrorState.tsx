import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export default function ErrorState({
    message = 'Une erreur est survenue. Vérifiez votre connexion.',
    onRetry,
}: ErrorStateProps) {
    return (
        <View className="flex-1 items-center justify-center p-8">
            <AlertTriangle size={48} color="#ef4444" />
            <Text className="text-slate-700 dark:text-slate-300 text-center text-base mt-4 mb-6 font-medium">
                {message}
            </Text>
            {onRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    className="bg-blue-600 px-6 py-3 rounded-full"
                    accessibilityRole="button"
                    accessibilityLabel="Réessayer le chargement"
                >
                    <Text className="text-white font-bold">Réessayer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
