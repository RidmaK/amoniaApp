import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        title: '',
      }}
    >
      <Stack.Screen 
        name="sign-in"
        options={{
          title: '',
        }}
      />
      <Stack.Screen 
        name="sign-up"
        options={{
          title: '',
        }}
      />
    </Stack>
  );
} 