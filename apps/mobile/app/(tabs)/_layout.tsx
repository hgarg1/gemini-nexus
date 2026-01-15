import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';
import { MessageSquare, Compass, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#09090b',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 85,
          paddingTop: 10,
          paddingBottom: 30,
        },
        tabBarBackground: () =>
            Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
            ) : undefined,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#52525b',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-500/10' : ''}`}>
              <MessageSquare size={24} color={color} fill={focused ? color : 'transparent'} />
            </View>
          )
        }}
      />
      <Tabs.Screen 
        name="explore" 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-500/10' : ''}`}>
              <Compass size={24} color={color} fill={focused ? color : 'transparent'} />
            </View>
          )
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-500/10' : ''}`}>
              <User size={24} color={color} fill={focused ? color : 'transparent'} />
            </View>
          )
        }}
      />
    </Tabs>
  );
}
