import { handleError } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, Lock, LogOut, Mail, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

export default function GarageProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ nom: '', prenom: '', email: '', role: 'mecanicien' });

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });

    useEffect(() => {
        fetchTeam();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchTeam = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('users').select('*').order('nom');
        if (data) setTeam(data);
        if (error) handleError(error, "Impossible de charger l'équipe.");
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (passwordForm.new.length < 6) {
            Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caractères.");
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: passwordForm.new });

        if (error) {
            Alert.alert("Erreur", error.message);
        } else {
            Alert.alert("Succès", "Mot de passe mis à jour !");
            setShowPasswordModal(false);
            setPasswordForm({ new: '', confirm: '' });
        }
    };

    const handleAddUser = async () => {
        if (!newUser.nom || !newUser.prenom) {
            Alert.alert("Erreur", "Nom et Prénom requis");
            return;
        }

        try {
            const { error } = await supabase.from('users').insert([{
                nom: newUser.nom,
                prenom: newUser.prenom,
                email: newUser.email || '',
                role: newUser.role,
                actif: true
            }]);

            if (error) {
                handleError(error, "Impossible d'ajouter le membre. Vérifiez la configuration de la base de données.");
            } else {
                Alert.alert("Succès", "Membre ajouté avec succès.");
                fetchTeam();
            }
            setShowAddModal(false);
            setNewUser({ nom: '', prenom: '', email: '', role: 'mecanicien' });

        } catch (e) {
            handleError(e, "Erreur inattendue lors de l'ajout.");
        }
    };


    const handleDeleteMember = (member: any) => {
        Alert.alert(
            "Supprimer le membre",
            `Voulez-vous supprimer ${member.prenom} ${member.nom} de l'équipe ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer", style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase.from('users').delete().eq('id', member.id);
                        if (error) Alert.alert("Erreur", error.message);
                        else {
                            Alert.alert("Succès", "Membre supprimé.");
                            fetchTeam();
                        }
                    }
                }
            ]
        );
    };


    const renderRightActions = (_progress: any, _dragX: any, member: any) => {
        return (
            <TouchableOpacity
                onPress={() => handleDeleteMember(member)}
                className="bg-red-500 justify-center items-center w-20 mb-3 rounded-r-[24px]"
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            "Déconnexion",
            "Voulez-vous vraiment vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Se déconnecter",
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/portal');
                    }
                }
            ]
        );
    };

    // Helper for color scheme if needed, or rely on NativeWind's dark mode
    // Assuming context or prop for theme, but standard replace uses plain styles
    const iconColor = '#0f172a'; // Default slate-900 for Light mode

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24 }}>

                    {/* Header */}
                    <View className="flex-row items-center mb-8">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mr-4 active:scale-95"
                        >
                            <ArrowLeft color="#64748b" size={24} />
                        </TouchableOpacity>
                        <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fiche Garage</Text>
                    </View>

                    {/* Garage Card - Modern */}
                    <View className="bg-blue-500 rounded-[32px] p-8 shadow-xl shadow-blue-500/30 mb-10 overflow-hidden relative">
                        {/* Decorative background elements */}
                        <View className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                        <View className="absolute bottom-[-40px] left-[-20px] w-32 h-32 bg-indigo-500/30 rounded-full blur-xl" />

                        <View className="mb-8">
                            <Text className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-2 opacity-80">Identité</Text>
                            <View className="flex-row items-center">
                                <Building2 size={32} color="white" className="mr-3" />
                                <Text className="text-white text-3xl font-black tracking-tight">Auto Reparis</Text>
                            </View>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-1 opacity-80">Email Pro</Text>
                                <View className="flex-row items-center">
                                    <Mail size={20} color="white" className="mr-3 opacity-90" />
                                    <Text className="text-white text-lg font-medium tracking-tight">{currentUser?.email || 'admin@autoreparis.com'}</Text>
                                </View>
                            </View>

                            <View>
                                <Text className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-1 opacity-80">Sécurité</Text>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Lock size={20} color="white" className="mr-3 opacity-90" />
                                        <Text className="text-white text-lg tracking-[6px] font-bold pt-1">••••••</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowPasswordModal(true)}
                                        className="bg-white/20 px-4 py-2 rounded-full border border-white/10 active:bg-white/30"
                                    >
                                        <Text className="text-white text-xs font-bold uppercase tracking-wide">Modifier</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Team Section */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-end mb-5 px-1">
                            <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">L'Équipe</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddModal(true)}
                                className="bg-slate-900 dark:bg-white px-5 py-3 rounded-full flex-row items-center shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                            >
                                <Plus size={18} className="text-white dark:text-slate-900 mr-2" strokeWidth={3} />
                                <Text className="text-white dark:text-slate-900 font-bold text-sm uppercase tracking-wide">Ajouter</Text>
                            </TouchableOpacity>
                        </View>

                        <View>
                            {team.map((member, idx) => (
                                <View key={member.id || idx} className="mb-4">
                                    <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, member)}>
                                        <View className="bg-white dark:bg-slate-900 p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <View className="flex-row items-center">
                                                <View className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl items-center justify-center mr-4 border border-slate-100 dark:border-slate-700/50">
                                                    <Text className="font-black text-slate-700 dark:text-slate-300 text-xl">
                                                        {member.prenom?.[0]}{member.nom?.[0]}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text className="text-slate-900 dark:text-white font-bold text-lg">{member.prenom} {member.nom}</Text>
                                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{member.role}</Text>
                                                </View>
                                            </View>
                                            <View className={`w-3 h-3 rounded-full ${member.actif ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                        </View>
                                    </Swipeable>
                                </View>
                            ))}
                            {team.length === 0 && !loading && (
                                <View className="items-center py-10 opacity-50">
                                    <View className="w-16 h-16 bg-slate-200 rounded-full mb-3" />
                                    <Text className="text-slate-400 font-bold">Aucun membre</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-50 dark:bg-red-500/10 h-[72px] rounded-[24px] flex-row items-center justify-center border border-red-100 dark:border-red-500/20 mt-4 active:scale-[0.98]"
                    >
                        <LogOut size={22} color="#ef4444" className="mr-3" />
                        <Text className="text-red-500 font-bold text-lg">Se déconnecter</Text>
                    </TouchableOpacity>

                    <View className="h-12" />

                </ScrollView>
            </SafeAreaView>

            {/* Add User Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View className="flex-1 justify-end">
                    <TouchableOpacity className="absolute top-0 bottom-0 left-0 right-0 bg-black/60" onPress={() => setShowAddModal(false)} />
                    <View className="bg-white dark:bg-slate-900 p-8 rounded-t-[40px] h-[65%] shadow-2xl">
                        <View className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full self-center mb-8" />
                        <Text className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Nouveau Membre</Text>

                        <View className="space-y-6">
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-slate-400 mb-2 font-bold text-xs uppercase tracking-wider">Prénom</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-lg"
                                        value={newUser.prenom}
                                        onChangeText={t => setNewUser({ ...newUser, prenom: t })}
                                        placeholder="Thomas"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-400 mb-2 font-bold text-xs uppercase tracking-wider">Nom</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-lg"
                                        value={newUser.nom}
                                        onChangeText={t => setNewUser({ ...newUser, nom: t })}
                                        placeholder="Dubois"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 mb-3 font-bold text-xs uppercase tracking-wider">Rôle</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                                    {['mecanicien', 'reception', 'admin'].map(role => (
                                        <TouchableOpacity
                                            key={role}
                                            onPress={() => setNewUser({ ...newUser, role })}
                                            className={`px-6 py-4 rounded-2xl border-2 mr-3 ${newUser.role === role ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'bg-transparent border-slate-200 dark:border-slate-800'}`}
                                        >
                                            <Text className={`font-bold capitalize text-base ${newUser.role === role ? 'text-white dark:text-slate-900' : 'text-slate-400'}`}>{role}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleAddUser}
                            className="bg-blue-500 w-full py-5 rounded-[24px] items-center mt-auto mb-4 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                        >
                            <Text className="text-white font-bold text-xl">Créer le profil</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={showPasswordModal} animationType="slide" transparent>
                <View className="flex-1 justify-end">
                    <TouchableOpacity className="absolute top-0 bottom-0 left-0 right-0 bg-black/60" onPress={() => setShowPasswordModal(false)} />
                    <View className="bg-white dark:bg-slate-900 p-8 rounded-t-[40px] h-[55%] shadow-2xl">
                        <View className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full self-center mb-8" />
                        <Text className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Mot de passe</Text>

                        <View className="space-y-5">
                            <View>
                                <Text className="text-slate-400 mb-2 font-bold text-xs uppercase tracking-wider">Nouveau mot de passe</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-lg"
                                    value={passwordForm.new}
                                    onChangeText={t => setPasswordForm({ ...passwordForm, new: t })}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                />
                            </View>
                            <View>
                                <Text className="text-slate-400 mb-2 font-bold text-xs uppercase tracking-wider">Confirmer</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-lg"
                                    value={passwordForm.confirm}
                                    onChangeText={t => setPasswordForm({ ...passwordForm, confirm: t })}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdatePassword}
                            className="bg-slate-900 dark:bg-white w-full py-5 rounded-[24px] items-center mt-auto mb-4 shadow-lg active:scale-[0.98]"
                        >
                            <Text className="text-white dark:text-slate-900 font-bold text-xl">Valider</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
