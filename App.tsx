import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import GoogleFit, { Scopes, AuthorizationResult } from 'react-native-google-fit';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [authResult, setAuthResult] = useState<AuthorizationResult | null>(null);

  const onImport = async () => {
    setLoading(true);
    const result = await GoogleFit.authorize({
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_HEART_RATE_READ,
      ],
    });
    setAuthResult(result);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Button title="Import from Google Fit" onPress={onImport} />
        {loading && <ActivityIndicator style={styles.indicator} />}
        {authResult && (
          <View style={styles.result}>
            <Text>Success: {String(authResult.success)}</Text>
            <Text>Message: {authResult.message}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  indicator: {
    marginTop: 12,
  },
  result: {
    marginTop: 20,
  },
});
