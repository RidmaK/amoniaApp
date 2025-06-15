import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="sign-in"
        options={{
          headerShown: false,
          title: '',
        }}
      />
      <Stack.Screen 
        name="sign-up"
        options={{
          headerShown: false,
          title: '',
        }}
      />
    </Stack>
  );
}