import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@baby_sleep_sessions';

export async function getSessions() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveSessions(sessions) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export async function getActiveSession() {
  const sessions = await getSessions();
  return sessions.find((s) => s.endTime === null) || null;
}

export async function startSleep() {
  const sessions = await getSessions();
  const newSession = {
    id: Date.now().toString(),
    startTime: Date.now(),
    endTime: null,
    duration: null,
  };
  await saveSessions([newSession, ...sessions]);
  return newSession;
}

export async function stopSleep() {
  const sessions = await getSessions();
  const activeIndex = sessions.findIndex((s) => s.endTime === null);
  if (activeIndex === -1) return null;

  const endTime = Date.now();
  sessions[activeIndex] = {
    ...sessions[activeIndex],
    endTime,
    duration: endTime - sessions[activeIndex].startTime,
  };
  await saveSessions(sessions);
  return sessions[activeIndex];
}

export async function deleteSession(id) {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((s) => s.id !== id));
}
