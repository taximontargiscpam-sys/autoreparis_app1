import { useUpdateInterventionStatus } from '@/lib/hooks/useInterventions';
import type { InterventionWithRelations, InterventionStatus } from '@/lib/database.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, Phone, User } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface StatusButtonProps {
    status: InterventionStatus;
    label: string;
    color: string;
    current: InterventionStatus;
}

interface InterventionSummaryProps {
    intervention: InterventionWithRelations;
    refresh: () => void;
}

export default function InterventionSummary({ intervention, refresh }: InterventionSummaryProps) {
    const { mutateAsync: updateStatus, isPending } = useUpdateInterventionStatus();

    const handleStatusChange = async (newStatus: InterventionStatus) => {
        try {
            await updateStatus({ id: intervention.id, statut: newStatus });
            refresh();
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
        }
    };

    const StatusButton = ({ status, label, color, current }: StatusButtonProps) => (
        <TouchableOpacity
            disabled={isPending}
            onPress={() => handleStatusChange(status)}
            className={`flex-1 py-3 items-center justify-center rounded-xl mx-1 border ${current === status ? `${color} bg-opacity-10` : 'border-slate-200 dark:border-slate-700 bg-transparent'}`}
            style={current === status ? { backgroundColor: color + '20', borderColor: color } : {}}
        >
            <View className={`w-3 h-3 rounded-full mb-2 ${current === status ? '' : 'bg-slate-300 dark:bg-slate-600'}`}
                style={current === status ? { backgroundColor: color } : {}} />
            <Text className={`text-xs font-bold ${current === status ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView className="flex-1 p-6">
            {/* Status Workflow */}
            <View className="mb-8">
                <Text className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Avancement</Text>
                <View className="flex-row">
                    <StatusButton status="planifiee" label="Planifiée" color="#3b82f6" current={intervention.statut} />
                    <StatusButton status="en_cours" label="En cours" color="#f97316" current={intervention.statut} />
                    <StatusButton status="terminee" label="Terminée" color="#22c55e" current={intervention.statut} />
                </View>
            </View>

            {/* Client Info */}
            <View className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <User size={20} color="#64748b" />
                    <Text className="text-lg font-bold text-slate-900 dark:text-white ml-3">Client</Text>
                </View>

                <View className="mb-3">
                    <Text className="text-slate-400 text-xs uppercase mb-1">Nom complet</Text>
                    <Text className="text-base text-slate-900 dark:text-white font-medium">{intervention.clients?.nom} {intervention.clients?.prenom}</Text>
                </View>
                <View className="flex-row">
                    <View className="flex-1">
                        <Text className="text-slate-400 text-xs uppercase mb-1">Téléphone</Text>
                        <View className="flex-row items-center">
                            <Phone size={14} color="#94a3b8" className="mr-1" />
                            <Text className="text-base text-slate-900 dark:text-white">{intervention.clients?.telephone || '--'}</Text>
                        </View>
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-400 text-xs uppercase mb-1">Email</Text>
                        <Text className="text-base text-slate-900 dark:text-white" numberOfLines={1}>{intervention.clients?.email || '--'}</Text>
                    </View>
                </View>
            </View>

            {/* Info Atelier */}
            <View className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <Clock size={20} color="#64748b" />
                    <Text className="text-lg font-bold text-slate-900 dark:text-white ml-3">Détails Atelier</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-slate-400 text-xs uppercase mb-1">Type d'intervention</Text>
                    <Text className="text-lg font-medium text-slate-900 dark:text-white">{intervention.type_intervention || 'Général'}</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-slate-400 text-xs uppercase mb-1">Date prévue</Text>
                    <View className="flex-row items-center">
                        <Calendar size={16} color="#94a3b8" className="mr-2" />
                        <Text className="text-base text-slate-900 dark:text-white">
                            {intervention.date_heure_debut_prevue ? format(new Date(intervention.date_heure_debut_prevue), 'PPP à p', { locale: fr }) : '--'}
                        </Text>
                    </View>
                </View>

                <View>
                    <Text className="text-slate-400 text-xs uppercase mb-1">Commentaires</Text>
                    <Text className="text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                        {intervention.commentaire || 'Aucun commentaire particulier.'}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}
