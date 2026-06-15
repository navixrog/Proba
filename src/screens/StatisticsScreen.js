import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessions } from '../storage/sleepStorage';
import { formatDuration } from '../utils/formatTime';

const BAR_MAX_HEIGHT = 150;

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d.getTime());
  }
  return days;
}

function getDayLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString('hr-HR', { weekday: 'short' });
}

export default function StatisticsScreen() {
  const [dayStats, setDayStats] = useState([]);
  const [totalToday, setTotalToday] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      calculate();
    }, [])
  );

  async function calculate() {
    const sessions = await getSessions();
    const completed = sessions.filter((s) => s.endTime !== null);

    const days = getLast7Days();
    const stats = days.map((dayStart) => {
      const dayEnd = dayStart + 86400000;
      const daySessions = completed.filter(
        (s) => s.startTime >= dayStart && s.startTime < dayEnd
      );
      const total = daySessions.reduce((sum, s) => sum + s.duration, 0);
      return { dayStart, total, count: daySessions.length };
    });

    setDayStats(stats);
    setTotalSessions(completed.length);

    const todayStart = days[days.length - 1];
    const todaySessions = completed.filter(
      (s) => s.startTime >= todayStart && s.startTime < todayStart + 86400000
    );
    setTotalToday(todaySessions.reduce((sum, s) => sum + s.duration, 0));

    if (completed.length > 0) {
      setAvgDuration(completed.reduce((sum, s) => sum + s.duration, 0) / completed.length);
    }
  }

  const maxTotal = Math.max(...dayStats.map((d) => d.total), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Danas ukupno</Text>
          <Text style={styles.summaryValue}>{formatDuration(totalToday)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Prosjek/sesija</Text>
          <Text style={styles.summaryValue}>{formatDuration(avgDuration)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ukupno sesija</Text>
          <Text style={styles.summaryValue}>{totalSessions}</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>Zadnjih 7 dana</Text>
      <View style={styles.chartCard}>
        <View style={styles.chart}>
          {dayStats.map((day, i) => {
            const barHeight =
              day.total > 0 ? Math.max((day.total / maxTotal) * BAR_MAX_HEIGHT, 6) : 0;
            return (
              <View key={i} style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {day.total > 0 ? formatDuration(day.total) : ''}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: barHeight }]} />
                </View>
                <Text style={styles.barLabel}>{getDayLabel(day.dayStart)}</Text>
                {day.count > 0 && (
                  <Text style={styles.barCount}>{day.count}×</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F4FF' },
  content: { padding: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryLabel: { fontSize: 11, color: '#999', marginBottom: 6, textAlign: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#7B5EA7', textAlign: 'center' },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: BAR_MAX_HEIGHT + 70,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 8,
    color: '#7B5EA7',
    marginBottom: 4,
    textAlign: 'center',
    height: 20,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    width: 26,
  },
  bar: {
    width: 26,
    backgroundColor: '#7B5EA7',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  barCount: {
    fontSize: 10,
    color: '#BBB',
    marginTop: 2,
  },
});
