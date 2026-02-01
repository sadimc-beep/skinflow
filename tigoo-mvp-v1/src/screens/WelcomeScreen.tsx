import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

export const WelcomeScreen = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome to Tigoo</Text>
            <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 24, marginBottom: 20 },
});
