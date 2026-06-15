import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import TrackerScreen from './src/screens/TrackerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Tracker: ['moon', 'moon-outline'],
  History: ['list', 'list-outline'],
  Statistics: ['bar-chart', 'bar-chart-outline'],
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const [active, inactive] = ICONS[route.name];
            return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#7B5EA7',
          tabBarInactiveTintColor: '#AAA',
          tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#EEE' },
          headerStyle: { backgroundColor: '#F8F4FF' },
          headerTitleStyle: { color: '#2D2D2D', fontWeight: '600' },
          headerShadowVisible: false,
        })}
      >
        <Tab.Screen
          name="Tracker"
          component={TrackerScreen}
          options={{ title: 'Praćenje', tabBarLabel: 'Praćenje' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Povijest', tabBarLabel: 'Povijest' }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{ title: 'Statistike', tabBarLabel: 'Statistike' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
