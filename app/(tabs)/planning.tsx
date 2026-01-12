import { supabase } from '@/lib/supabase';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PlanningScreen() {
    // Basic Data
    const startDate = new Date();
    const calendarDays = Array.from({ length: 60 }, (_, i) => addDays(startDate, i));

    // Global State
    const [selectedDate, setSelectedDate] = useState(startDate);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Team Data
    const [users, setUsers] = useState<any[]>([]);
    const [availabilities, setAvailabilities] = useState<any[]>([]);

    // --- MODAL STATE: USER CALENDAR ---
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userModalMonth, setUserModalMonth] = useState(new Date());
    const [userMonthlyAvailability, setUserMonthlyAvailability] = useState<any[]>([]);

    // --- MODAL STATE: ASSIGNMENT ---
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
    const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);

    // --- MODAL STATE: DETAIL APPOINTMENT ---
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

    // Helpers
    // Helpers
    const getStatusColorBg = (status: string) => {
        switch (status) {
            case 'planifiee': return 'bg-indigo-100';
            case 'en_cours': return 'bg-orange-100';
            case 'terminee': return 'bg-emerald-100';
            default: return 'bg-slate-100';
        }
    };

    const getStatusColorText = (status: string) => {
        switch (status) {
            case 'planifiee': return 'text-indigo-700';
            case 'en_cours': return 'text-orange-700';
            case 'terminee': return 'text-emerald-700';
            default: return 'text-slate-700';
        }
    };

    const getStatusBorderColor = (status: string) => {
        switch (status) {
            case 'planifiee': return 'border-l-indigo-600';
            case 'en_cours': return 'border-l-orange-500';
            case 'terminee': return 'border-l-emerald-500';
            default: return 'border-l-slate-300';
        }
    };

    // --- FETCHING MAIN DATA ---

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('interventions')
                .select('*, clients(nom), vehicles(marque, modele), mecanicien:users(nom, prenom)')
                .order('date_heure_debut_prevue', { ascending: true });

            if (data) {
                const dayAppointments = data.filter(item => {
                    if (!item.date_heure_debut_prevue) return false;
                    const itemDate = new Date(item.date_heure_debut_prevue);
                    return !isNaN(itemDate.getTime()) && isSameDay(itemDate, selectedDate);
                });
                setAppointments(dayAppointments);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchTeamAndAvailability = async () => {
        try {
            // 1. Fetch Users
            const { data: userData } = await supabase.from('users').select('*').eq('actif', true).order('nom');
            if (userData) setUsers(userData);

            // 2. Fetch Availabilities for SELECTED DAY (Main View)
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const { data: availData } = await supabase
                .from('team_availability')
                .select('*')
                .eq('date', dateStr);

            if (availData) setAvailabilities(availData);
        } catch (err) {
            console.error('Error fetching team:', err);
        }
    };

    // --- USER MODAL LOGIC ---

    const handleUserClick = (user: any) => {
        setSelectedUser(user);
        setUserModalMonth(new Date()); // Reset to current month
        setShowUserModal(true);
    };

    const fetchUserMonthlyAvailability = async () => {
        if (!selectedUser) return;

        try {
            const startStr = format(startOfMonth(userModalMonth), 'yyyy-MM-dd');
            const endStr = format(endOfMonth(userModalMonth), 'yyyy-MM-dd');

            const { data } = await supabase
                .from('team_availability')
                .select('*')
                .eq('user_id', selectedUser.id)
                .gte('date', startStr)
                .lte('date', endStr);

            if (data) setUserMonthlyAvailability(data);
            else setUserMonthlyAvailability([]);

        } catch (err) {
            console.error('Error fetching monthly availability:', err);
        }
    };

    useEffect(() => {
        if (showUserModal && selectedUser) {
            fetchUserMonthlyAvailability();
        }
    }, [showUserModal, selectedUser, userModalMonth]);

    const toggleDayStatus = (date: Date) => {
        if (!selectedUser) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        // Find current status
        const existingRecord = userMonthlyAvailability.find(r => r.date === dateStr);
        const currentStatus = existingRecord?.statut || 'present'; // Default assumption
        const newStatus = currentStatus === 'repos' ? 'present' : 'repos';

        // Local State Update Only - Mark as modified
        setUserMonthlyAvailability(prev => {
            const exists = prev.find(r => r.date === dateStr);
            if (exists) {
                return prev.map(r => r.date === dateStr ? { ...r, statut: newStatus, _modified: true } : r);
            } else {
                return [...prev, { id: 'local-' + Math.random(), user_id: selectedUser.id, date: dateStr, statut: newStatus, _modified: true }];
            }
        });
    };

    const handleSaveAvailability = async () => {
        if (!selectedUser) {
            Alert.alert("Erreur", "Aucun utilisateur sélectionné pour la sauvegarde.");
            return;
        }
        Alert.alert("Info", "Sauvegarde lancée...");
        try {
            setLoading(true);
            const modifiedRecords = userMonthlyAvailability.filter(r => r._modified);

            if (modifiedRecords.length === 0) {
                Alert.alert("Info", "Aucune modification à sauvegarder.");
                setShowUserModal(false);
                setLoading(false);
                return;
            }

            // Process updates sequentially
            for (const record of modifiedRecords) {
                const { data: checkData, error: checkError } = await supabase
                    .from('team_availability')
                    .select('id')
                    .eq('user_id', selectedUser.id)
                    .eq('date', record.date)
                    .maybeSingle();

                if (checkError) throw checkError;

                if (checkData) {
                    const { error: updateError } = await supabase.from('team_availability').update({ statut: record.statut }).eq('id', checkData.id);
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase.from('team_availability').insert([{
                        user_id: selectedUser.id,
                        date: record.date,
                        statut: record.statut
                    }]);
                    if (insertError) throw insertError;
                }
            }

            Alert.alert("Succès", "Disponibilités mises à jour !");
            setShowUserModal(false);
            fetchTeamAndAvailability(); // Refresh main view
        } catch (err: any) {
            console.error("Save error:", err);
            let msg = err.message || 'Erreur inconnue';
            // Handle common Supabase errors
            if (err.code === '23503') msg = "Cet employé n'existe pas valides en base (FK Violation).";
            if (err.code === '42501') msg = "Permission bloquée (RLS). Lancez le script SQL.";

            Alert.alert("Erreur", "Sauvegarde impossible: " + msg);
        } finally {
            setLoading(false);
        }
    };

    // --- ASSIGNMENT LOGIC ---

    const handleAssign = async () => {
        if (!selectedInterventionId || !selectedMechanicId) {
            Alert.alert('Erreur', 'Veuillez sélectionner une intervention et un mécanicien.');
            return;
        }

        try {
            const { error } = await supabase
                .from('interventions')
                .update({ mecanicien_id: selectedMechanicId, statut: 'planifiee' })
                .eq('id', selectedInterventionId);

            if (error) throw error;

            Alert.alert('Succès', 'Intervention assignée avec succès.');
            setShowAssignModal(false);
            setSelectedInterventionId(null);
            setSelectedMechanicId(null);
            fetchAppointments(); // Refresh list
        } catch (err) {
            console.error('Error assigning:', err);
            Alert.alert('Erreur', "Echec de l'assignation");
        }
    };


    // --- EFFECTS ---
    useEffect(() => {
        fetchAppointments();
        fetchTeamAndAvailability();
    }, [selectedDate]);

    // --- RENDER ---
    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="p-6 pb-2">
                <Text className="text-3xl font-black text-slate-900 dark:text-white mb-6">Planning Connecté</Text>

                {/* Visual Feedback for Loading */}
                <View className="h-6 mb-2">
                    {loading && <Text className="text-primary font-bold">Chargement...</Text>}
                </View>

                {/* Team Planning Horizontal Strip */}
                <View className="mb-6">
                    <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-3">Équipe ({format(selectedDate, 'EEEE d', { locale: fr })})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                        {users.map((user) => {
                            const availability = availabilities.find(a => a.user_id === user.id);
                            const isPresent = !availability || availability?.statut === 'present';

                            return (
                                <TouchableOpacity
                                    key={user.id}
                                    onPress={() => handleUserClick(user)}
                                    className={`mr-4 items-center justify-center p-4 rounded-2xl w-24 h-28 border ${isPresent ? 'bg-white border-slate-100' : 'bg-slate-100 border-slate-200 opacity-60'}`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isPresent ? 'bg-green-100' : 'bg-slate-200'}`}>
                                        <Text className={`font-bold ${isPresent ? 'text-green-700' : 'text-slate-500'}`}>{user.prenom?.[0]}{user.nom?.[0]}</Text>
                                    </View>
                                    <Text className="font-bold text-slate-900 text-xs text-center mb-1" numberOfLines={1}>{user.prenom}</Text>
                                    <View className={`px-2 py-0.5 rounded-full ${isPresent ? 'bg-green-100' : 'bg-slate-200'}`}>
                                        <Text className={`text-[8px] font-bold uppercase ${isPresent ? 'text-green-700' : 'text-slate-500'}`}>
                                            {isPresent ? 'Présent' : 'Absent'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Calendar Strip */}
                <View className="mb-6">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                        {calendarDays.map((date, index) => {
                            const isSelected = isSameDay(date, selectedDate);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedDate(date)}
                                    className={`items-center justify-center w-14 h-20 rounded-2xl mr-3 ${isSelected ? 'bg-primary' : 'bg-white border border-slate-200'}`}
                                >
                                    <Text className={`text-xs font-medium mb-1 ${isSelected ? 'text-white' : 'text-slate-400'}`}>{format(date, 'EEE', { locale: fr })}</Text>
                                    <Text className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{format(date, 'd')}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} />}
            >
                <Text className="text-slate-500 font-bold uppercase text-xs mb-3">Rendez-vous ({appointments.length})</Text>

                {appointments.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedAppointment(item)}
                        className={`bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm border-l-4 ${getStatusBorderColor(item.statut)} border-slate-100 dark:border-slate-700 active:scale-[0.98]`}
                    >
                        <View className="flex-row justify-between mb-2">
                            <Text className="font-bold text-lg text-slate-900 dark:text-white">{item.clients?.nom || 'Client'}</Text>
                            <View className={`px-2 py-1 rounded-md ${getStatusColorBg(item.statut)}`}>
                                <Text className={`font-bold text-xs ${getStatusColorText(item.statut)}`}>
                                    {item.date_heure_debut_prevue ? format(new Date(item.date_heure_debut_prevue), 'HH:mm') : '--:--'}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="mr-2 text-xs">🔧</Text>
                            <Text className="text-slate-500">{item.vehicles?.marque} {item.vehicles?.modele}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {appointments.length === 0 && !loading && (
                    <Text className="text-slate-400 italic text-center mt-4">Aucun rendez-vous</Text>
                )}
                <View className="h-20" />
            </ScrollView>

            {/* --- APPOINTMENT DETAILS MODAL --- */}
            {selectedAppointment && (
                <View className="absolute top-0 bottom-0 left-0 right-0 z-50">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setSelectedAppointment(null)}
                        className="absolute top-0 bottom-0 left-0 right-0 bg-black/60"
                    />
                    <View className="flex-1 justify-end">
                        <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-12 w-full shadow-2xl">
                            {/* Header */}
                            <View className="flex-row justify-between items-start mb-6">
                                <View className="flex-1 mr-4">
                                    <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Intervention</Text>
                                    <Text className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-1">
                                        {selectedAppointment.clients?.nom || 'Client Inconnu'}
                                    </Text>
                                    <Text className="text-lg font-bold text-slate-600 dark:text-slate-300">
                                        {selectedAppointment.vehicles?.marque} {selectedAppointment.vehicles?.modele}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedAppointment(null)} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center filter active:bg-slate-200">
                                    <Text className="text-slate-500 font-bold text-lg">✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Info Grid */}
                            <View className="flex-row flex-wrap gap-3 mb-8">
                                <View className="w-[48%] bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                                    <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Date</Text>
                                    <Text className="text-slate-900 dark:text-white font-bold text-base capitalize">
                                        {selectedAppointment.date_heure_debut_prevue ? format(new Date(selectedAppointment.date_heure_debut_prevue), 'EEE d MMM', { locale: fr }) : '--'}
                                    </Text>
                                </View>
                                <View className="w-[48%] bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                                    <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Heure</Text>
                                    <Text className="text-slate-900 dark:text-white font-bold text-xl">
                                        {selectedAppointment.date_heure_debut_prevue ? format(new Date(selectedAppointment.date_heure_debut_prevue), 'HH:mm') : '--:--'}
                                    </Text>
                                </View>

                                <View className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full items-center justify-center mr-3 border border-slate-100 dark:border-slate-600">
                                            <Text className="font-bold text-slate-700 dark:text-white">
                                                {selectedAppointment.mecanicien?.prenom?.[0] || '?'}{selectedAppointment.mecanicien?.nom?.[0] || '?'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-slate-400 text-xs font-bold uppercase">Mécanicien</Text>
                                            <Text className="text-slate-900 dark:text-white font-bold text-base">
                                                {selectedAppointment.mecanicien ? `${selectedAppointment.mecanicien.prenom} ${selectedAppointment.mecanicien.nom}` : 'Non assigné'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${getStatusColorBg(selectedAppointment.statut)}`}>
                                        <Text className={`font-bold text-xs ${getStatusColorText(selectedAppointment.statut)} capitalize`}>
                                            {selectedAppointment.statut}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => setSelectedAppointment(null)}
                                className="bg-slate-900 dark:bg-white w-full py-4 rounded-[20px] items-center active:scale-[0.98]"
                            >
                                <Text className="text-white dark:text-slate-900 font-bold text-lg">Fermer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {showUserModal && selectedUser && (
                <View className="absolute top-0 bottom-0 left-0 right-0 z-50">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setShowUserModal(false)}
                        className="absolute top-0 bottom-0 left-0 right-0 bg-black/60"
                    />
                    <View className="flex-1 justify-center px-4">
                        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl">
                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.prenom} {selectedUser.nom}</Text>
                                    <Text className="text-slate-500">Disponibilités</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowUserModal(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <Text className="text-lg font-bold">✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Month Nav */}
                            <View className="flex-row justify-between items-center mb-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                                <TouchableOpacity onPress={() => setUserModalMonth(prev => subMonths(prev, 1))} className="p-2">
                                    <Text className="text-2xl">‹</Text>
                                </TouchableOpacity>
                                <Text className="font-bold text-lg capitalize">{format(userModalMonth, 'MMMM yyyy', { locale: fr })}</Text>
                                <TouchableOpacity onPress={() => setUserModalMonth(prev => addMonths(prev, 1))} className="p-2">
                                    <Text className="text-2xl">›</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Weekday Headers */}
                            <View className="flex-row mb-2">
                                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                                    <View key={d} className="w-[14.28%] items-center">
                                        <Text className="text-xs font-bold text-slate-400 uppercase">{d}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Calendar Grid */}
                            <View className="flex-row flex-wrap">
                                {/* Padding for start of month */}
                                {Array.from({ length: (startOfMonth(userModalMonth).getDay() + 6) % 7 }).map((_, i) => (
                                    <View key={`pad-${i}`} className="w-[14.28%] aspect-square mb-2" />
                                ))}

                                {eachDayOfInterval({ start: startOfMonth(userModalMonth), end: endOfMonth(userModalMonth) }).map((date, idx) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const record = userMonthlyAvailability.find(r => r.date === dateStr);
                                    const status = record?.statut || 'present';
                                    const isRepos = status === 'repos';

                                    return (
                                        <View key={idx} className="w-[14.28%] items-center mb-2">
                                            <TouchableOpacity
                                                onPress={() => toggleDayStatus(date)}
                                                className={`w-[90%] aspect-square rounded-lg items-center justify-center ${isRepos ? 'bg-red-100 border border-red-200' : 'bg-green-100 border border-green-200'}`}
                                            >
                                                <Text className={`font-bold text-xs ${isRepos ? 'text-red-700' : 'text-green-700'}`}>{format(date, 'd')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )
                                })}
                            </View>

                            <View className="mt-4 flex-row justify-center space-x-4">
                                <View className="flex-row items-center mr-4">
                                    <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                                    <Text className="text-xs text-slate-500">Présent</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                                    <Text className="text-xs text-slate-500">Abs/Repos</Text>
                                </View>
                            </View>

                            {/* Save Button */}
                            <View className="mt-6">
                                <TouchableOpacity
                                    onPress={handleSaveAvailability}
                                    className="bg-primary w-full py-4 rounded-xl items-center shadow-lg shadow-blue-500/30"
                                >
                                    {loading ? (
                                        <Text className="text-white font-bold text-lg">Enregistrement...</Text>
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Sauvegarder</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* --- ASSIGNMENT MODAL --- */}
            {showAssignModal && (
                <View className="absolute top-0 bottom-0 left-0 right-0 z-50">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setShowAssignModal(false)}
                        className="absolute top-0 bottom-0 left-0 right-0 bg-black/50"
                    />
                    <View className="flex-1 justify-end">
                        <View className="bg-white dark:bg-slate-900 rounded-t-[30px] p-6 h-[70%] w-full">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-slate-900 dark:text-white">Planifier</Text>
                                <TouchableOpacity onPress={() => setShowAssignModal(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                                    <Text className="text-lg font-bold">✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text className="text-slate-500 font-bold uppercase text-xs mb-3">1. Intervention</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                    {appointments.filter(a => !a.mecanicien_id).map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={() => setSelectedInterventionId(item.id)}
                                            className={`mr-3 p-4 rounded-xl border w-60 ${selectedInterventionId === item.id ? 'bg-primary border-primary' : 'bg-white border-slate-200'}`}
                                        >
                                            <Text className={`font-bold ${selectedInterventionId === item.id ? 'text-white' : 'text-slate-900'}`}>{item.vehicles?.modele} - {item.clients?.nom}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {appointments.filter(a => !a.mecanicien_id).length === 0 && (
                                        <Text className="text-slate-400 italic">Aucune intervention à assigner</Text>
                                    )}
                                </ScrollView>

                                <Text className="text-slate-500 font-bold uppercase text-xs mb-3">2. Mécanicien</Text>
                                <View className="flex-row flex-wrap mb-6">
                                    {users.map((user) => (
                                        <TouchableOpacity
                                            key={user.id}
                                            onPress={() => setSelectedMechanicId(user.id)}
                                            className={`mr-3 mb-3 p-3 rounded-xl border ${selectedMechanicId === user.id ? 'bg-primary border-primary' : 'bg-white border-slate-200'}`}
                                        >
                                            <Text className={`font-bold ${selectedMechanicId === user.id ? 'text-white' : 'text-slate-900'}`}>{user.prenom}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    onPress={handleAssign}
                                    className={`bg-primary py-4 rounded-xl items-center ${(!selectedInterventionId || !selectedMechanicId) ? 'opacity-50' : ''}`}
                                    disabled={!selectedInterventionId || !selectedMechanicId}
                                >
                                    <Text className="font-bold text-white">Valider</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </View>
            )}

            {/* FAB Button */}
            <TouchableOpacity
                onPress={() => setShowAssignModal(true)}
                className="absolute bottom-6 right-6 bg-primary px-5 py-3 rounded-full flex-row items-center justify-center shadow-lg shadow-blue-500/50"
            >
                <Text className="text-white text-xl mr-2">+</Text>
                <Text className="text-white font-bold text-base">Assigner</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
