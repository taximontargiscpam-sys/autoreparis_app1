import { useLead } from '@/lib/hooks/useLeads';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Car, FileText, Mail, MapPin, Phone, Wrench } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function LeadDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: lead, isLoading } = useLead(id);

    const handleCall = () => {
        const phone = lead?.telephone || (lead as any)?.tel;
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = () => {
        const email = lead?.email;
        if (email) Linking.openURL(`mailto:${email}`);
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const isConverted = lead?.statut === 'converti' || lead?.statut === 'gagne';

    if (!lead) return null;

    // Helper to render a field if it exists
    const Field = ({ icon: Icon, label, value, isLink = false, action }: any) => {
        if (!value) return null;
        return (
            <TouchableOpacity
                disabled={!isLink}
                onPress={action}
                className="flex-row items-center py-3 border-b border-slate-100 dark:border-slate-800"
            >
                <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4">
                    <Icon size={20} className="text-slate-500 dark:text-slate-400" />
                </View>
                <View className="flex-1">
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">{label}</Text>
                    <Text className={`text-base font-medium ${isLink ? 'text-blue-500' : 'text-slate-900 dark:text-white'}`}>
                        {value}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const formatDateSafe = (dateString: string | null | undefined, formatStr: string) => {
        if (!dateString) return 'Date inconnue';
        try {
            return format(new Date(dateString), formatStr, { locale: fr });
        } catch (e) {
            return 'Date invalide';
        }
    };

    const firstName = lead.prenom || (lead as any).prénom || 'N/A';
    const lastName = lead.nom || 'N/A';
    const date = formatDateSafe(lead.created_at || (lead as any).cree_a, "d MMMM yyyy 'à' HH:mm");

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="p-6">
                    {/* Header */}
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                            <Text className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                {firstName[0]}{lastName[0]}
                            </Text>
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                            {firstName} {lastName}
                        </Text>
                        <Text className="text-slate-500 mt-1">{date}</Text>
                        <View className="mt-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Text className="text-green-700 dark:text-green-400 text-xs font-bold uppercase">{lead.statut || 'NOUVEAU'}</Text>
                        </View>
                    </View>

                    {/* Main Info */}
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Coordonnées</Text>
                        <Field icon={Phone} label="Téléphone" value={lead.telephone || (lead as any).tel} isLink action={handleCall} />
                        <Field icon={Mail} label="Email" value={lead.email} isLink action={handleEmail} />
                        <Field icon={MapPin} label="Adresse" value={(lead as any).code_postal ? `${(lead as any).code_postal} ${(lead as any).ville || ''}` : (lead as any).adresse} />
                    </View>

                    {/* Request Details */}
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Demande</Text>
                        <Field icon={Car} label="Véhicule" value={lead.vehicle_model || ((lead as any).marque ? `${(lead as any).marque} ${(lead as any).modele}`.trim() : 'Non spécifié')} />
                        {(lead as any).annee && <Field icon={Calendar} label="Année" value={String((lead as any).annee)} />}
                        <Field icon={FileText} label="Immatriculation" value={(lead as any).immatriculation || (lead as any).plaque} />

                        {(lead as any).service_souhaite && <Field icon={Wrench} label="Service souhaité" value={(lead as any).service_souhaite} />}
                        {(lead as any).date_souhaitee && <Field icon={Calendar} label="Date souhaitée" value={formatDateSafe((lead as any).date_souhaitee, "d MMMM yyyy")} />}

                        <View className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Message du client</Text>
                            <Text className="text-slate-800 dark:text-slate-200 text-base leading-7 italic">
                                "{lead.message || (lead as any).description || 'Aucun message'}"
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Bar */}
            <View className="absolute bottom-8 left-5 right-5 z-20">
                <View className="flex-row gap-3 bg-slate-900 p-2 rounded-[24px] border border-slate-700 shadow-2xl shadow-black">
                    <TouchableOpacity
                        onPress={handleCall}
                        className="flex-1 bg-emerald-500 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    >
                        <Phone size={20} color="white" className="mr-2" />
                        <Text className="text-white font-bold text-base">Appeler</Text>
                    </TouchableOpacity>

                    {!isConverted && (
                        <Link
                            href={{
                                pathname: '/interventions/new',
                                params: {
                                    lead_id: lead.id,
                                    nom: lead.nom || '',
                                    prenom: lead.prenom || '',
                                    telephone: lead.telephone || (lead as any).tel || '',
                                    email: lead.email || '',
                                    marque: (lead as any).marque || '',
                                    modele: (lead as any).modele || lead.vehicle_model || '',
                                    immatriculation: (lead as any).immatriculation || (lead as any).plaque || '',
                                    commentaire: lead.message || (lead as any).description || ''
                                }
                            }}
                            asChild
                        >
                            <TouchableOpacity
                                className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/40 active:scale-[0.98]"
                            >
                                <Calendar size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-sm uppercase tracking-wider">Planifier</Text>
                            </TouchableOpacity>
                        </Link>
                    )}
                </View>
            </View>
        </View>
    );
}
