import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

import GoogleFit, { Scopes, AuthorizationResult } from 'react-native-google-fit';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';

const hkPerms: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.MindfulSession,
    ],
    write: [],
  },
};

type HRSample = { startDate: string; endDate: string; value?: number };

export default function App() {
  // ANDROID
  const [loading, setLoading] = useState(false);
  const [authResult, setAuthResult] = useState<AuthorizationResult | null>(null);

  // iOS
  const [hkLoading, setHkLoading] = useState(false);
  const [hkAuthorized, setHkAuthorized] = useState(false);
  const [hr, setHr] = useState<HRSample[]>([]);

  // ---- ANDROID: Google Fit authorize ----
  const onImportGoogleFit = async () => {
    setLoading(true);
    try {
      const result = await GoogleFit.authorize({
        scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_HEART_RATE_READ],
      });
      setAuthResult(result);
    } catch (e: any) {
      setAuthResult({ success: false, message: String(e) } as AuthorizationResult);
    } finally {
      setLoading(false);
    }
  };

  // ---- iOS: HealthKit authorize ----
  const onImportHealth = () => {
    if (Platform.OS !== 'ios') return;
    setHkLoading(true);
    AppleHealthKit.initHealthKit(hkPerms, (err) => {
      setHkLoading(false);
      if (err) {
        Alert.alert('HealthKit error', String(err));
        setHkAuthorized(false);
        return;
      }
      setHkAuthorized(true);
      Alert.alert('HealthKit', 'Authorization success');
    });
  };

  // ---- iOS: quick fetch – Heart Rate (last 24h) ----
  const fetchHeartRate = () => {
    if (!hkAuthorized) return Alert.alert('HealthKit', 'Authorize first.');
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    setHkLoading(true);
    AppleHealthKit.getHeartRateSamples(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err, results: any[]) => {
        setHkLoading(false);
        if (err) return Alert.alert('HR error', String(err));
        setHr(results?.slice?.(0, 50) ?? []);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* ANDROID UI */}
        {Platform.OS === 'android' && (
          <View>
            <Button title="Import from Google Fit" onPress={onImportGoogleFit} />
            {loading && <ActivityIndicator style={styles.indicator} />}
            {authResult && (
              <View style={styles.result}>
                <Text>Success: {String(authResult.success)}</Text>
                <Text>Message: {authResult.message}</Text>
              </View>
            )}
          </View>
        )}

        {/* iOS UI */}
        {Platform.OS === 'ios' && (
          <View>
            <Button title="Import from Apple Health" onPress={onImportHealth} />
            <View style={{ height: 10 }} />
            <Button title="Load Heart Rate (last 24h)" onPress={fetchHeartRate} />
            {hkLoading && <ActivityIndicator style={styles.indicator} />}
            {!!hr.length && (
              <View style={styles.result}>
                <Text style={styles.h2}>Heart Rate Samples</Text>
                {hr.map((s, i) => (
                  <Text key={i} style={styles.row}>
                    {s.startDate?.slice(0, 19)} — {s.value} bpm
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 16, gap: 12 },
  indicator: { marginTop: 12 },
  result: { marginTop: 20 },
  h2: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  row: { fontSize: 14, marginBottom: 4 },
});
