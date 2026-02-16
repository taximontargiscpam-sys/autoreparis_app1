import { useRouter } from 'expo-router';
import { Lock, LogIn, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    function translateAuthError(msg: string): string {
        if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
        if (msg.includes('Email not confirmed')) return "Votre email n'a pas encore été confirmé.";
        if (msg.includes('Too many requests')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
        if (msg.includes('User not found')) return 'Aucun compte trouvé avec cet email.';
        return 'Erreur de connexion. Veuillez réessayer.';
    }

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Erreur', translateAuthError(error.message));
            setLoading(false);
        } else {
            router.replace('/(tabs)');
        }
        setLoading(false);
    }

    async function handleForgotPassword() {
        if (!email.trim()) {
            Alert.alert('Email requis', 'Veuillez entrer votre email pour réinitialiser votre mot de passe.');
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) {
            Alert.alert('Erreur', translateAuthError(error.message));
        } else {
            Alert.alert('Email envoyé', 'Un lien de réinitialisation a été envoyé à ' + email.trim());
        }
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-slate-900 justify-center items-center p-6">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full max-w-sm">

                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-4 shadow-lg">
                        <Text className="text-white text-3xl font-bold">AR</Text>
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white">AutoReparis OS</Text>
                    <Text className="text-gray-500 mt-2">Connectez-vous à votre atelier</Text>
                </View>

                <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1">Email</Text>
                        <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg h-12 px-3 bg-gray-50 dark:bg-slate-700">
                            <Mail size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 dark:text-white"
                                onChangeText={(text) => setEmail(text)}
                                value={email}
                                placeholder="email@autoreparis.com"
                                autoCapitalize="none"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    <View className="mt-4">
                        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1">Mot de passe</Text>
                        <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg h-12 px-3 bg-gray-50 dark:bg-slate-700">
                            <Lock size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 dark:text-white"
                                onChangeText={(text) => setPassword(text)}
                                value={password}
                                placeholder="******"
                                secureTextEntry={true}
                                autoCapitalize="none"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        className={`flex-row items-center justify-center h-12 rounded-lg mt-6 ${loading ? 'bg-blue-400' : 'bg-primary'} shadow-md`}
                        disabled={loading}
                        onPress={signInWithEmail}
                    >
                        {loading ? (
                            <Text className="text-white font-bold text-lg">Chargement...</Text>
                        ) : (
                            <>
                                <LogIn size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Se connecter</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className="mt-4 items-center"
                    onPress={handleForgotPassword}
                >
                    <Text className="text-blue-500 text-sm">Mot de passe oublié ?</Text>
                </TouchableOpacity>

                {/* Back to Home Link */}
                <TouchableOpacity
                    className="mt-8 flex-row items-center justify-center space-x-2"
                    onPress={() => router.replace('/')}
                >
                    <Text className="text-slate-500 dark:text-slate-500 text-sm">Retour à l'accueil</Text>
                </TouchableOpacity>



            </KeyboardAvoidingView>
        </View>
    );
}
