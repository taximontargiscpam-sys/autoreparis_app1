import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModalScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
          AutoReparis OS
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
          Gestion d'atelier automobile professionnelle
        </Text>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </SafeAreaView>
  );
}
