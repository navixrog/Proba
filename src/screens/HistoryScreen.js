import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessions, deleteSession } from '../storage/sleepStorage';
import { formatDuration, formatTime, formatDate } from '../utils/formatTime';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  async function loadSessions() {
    setRefreshing(true);
    const data = await getSessions();
    setSessions(data.filter((s) => s.endTime !== null));
    setRefreshing(false);
  }

  function handleDelete(id) {
    Alert.alert('Obriši sesiju', 'Jesi li siguran/a da želiš obrisati ovu sesiju?', [
      { text: 'Odustani', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          loadSessions();
        },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.date}>{formatDate(item.startTime)}</Text>
          <Text style={styles.time}>
            {formatTime(item.startTime)} – {formatTime(item.endTime)}
          </Text>
          <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌙</Text>
          <Text style={styles.emptyText}>Još nema zabilježenih sesija sna</Text>
          <Text style={styles.emptyHint}>Idi na „Praćenje" i pokreni prvu sesiju</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadSessions}
              tintColor="#7B5EA7"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F4FF' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardLeft: { flex: 1 },
  date: { fontSize: 12, color: '#AAA', marginBottom: 4, textTransform: 'capitalize' },
  time: { fontSize: 16, color: '#2D2D2D', fontWeight: '500' },
  duration: { fontSize: 14, color: '#7B5EA7', marginTop: 5, fontWeight: '700' },
  deleteBtn: { padding: 8, marginLeft: 8 },
  deleteText: { color: '#FF85A2', fontSize: 18, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  emptyHint: { color: '#AAA', fontSize: 13, marginTop: 8, textAlign: 'center' },
});
