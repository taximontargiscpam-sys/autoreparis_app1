import React from 'react';
import { Text, View } from 'react-native';
import type { InterventionStatus } from '@/lib/database.types';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planifiee: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Planifiée' },
  en_cours: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'En cours' },
  en_attente_pieces: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Attente pièces' },
  terminee: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Terminée' },
  facturee: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Facturée' },
  annulee: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Annulée' },
  no_show: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'No-show' },
};

interface StatusBadgeProps {
  status: InterventionStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: 'bg-slate-500/10', text: 'text-slate-500', label: status };

  return (
    <View className={`px-3 py-1 rounded-full ${style.bg}`}>
      <Text className={`text-xs font-bold ${style.text}`}>{style.label}</Text>
    </View>
  );
}

