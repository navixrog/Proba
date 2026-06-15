import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getActiveSession, startSleep, stopSleep } from '../storage/sleepStorage';
import { formatDuration, formatTime } from '../utils/formatTime';

export default function TrackerScreen() {
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadActive();
    }, [])
  );

  async function loadActive() {
    const session = await getActiveSession();
    setActiveSession(session);
    if (session) {
      setElapsed(Date.now() - session.startTime);
    }
  }

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - activeSession.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  async function handleToggle() {
    if (activeSession) {
      await stopSleep();
      setActiveSession(null);
      setElapsed(0);
    } else {
      const session = await startSleep();
      setActiveSession(session);
      setElapsed(0);
    }
  }

  const isSleeping = !!activeSession;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{isSleeping ? '😴' : '👶'}</Text>
      <Text style={styles.statusText}>
        {isSleeping ? 'Beba spava' : 'Beba je budna'}
      </Text>

      {isSleeping && (
        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, isSleeping ? styles.stopButton : styles.startButton]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isSleeping ? 'Zaustavi praćenje' : 'Počni pratiti'}
        </Text>
      </TouchableOpacity>

      {isSleeping && (
        <Text style={styles.startedAt}>
          Počelo u {formatTime(activeSession.startTime)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  timer: {
    fontSize: 58,
    fontWeight: '300',
    color: '#7B5EA7',
    marginBottom: 40,
    fontVariant: ['tabular-nums'],
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 52,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#7B5EA7',
  },
  stopButton: {
    backgroundColor: '#FF85A2',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: '600',
  },
  startedAt: {
    marginTop: 24,
    color: '#888',
    fontSize: 15,
  },
});
