import { Tabs } from "expo-router";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { MessageSquare, Globe, Settings, Database } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          elevation: 0,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
          backgroundColor: "transparent",
        },
        tabBarBackground: () => (
            <BlurView intensity={90} tint="dark" style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)" }} />
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#00f2ff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.2)",
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center top-4 p-2 rounded-xl ${focused ? "bg-primary/10" : ""}`}>
                <MessageSquare color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
            tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center top-4 p-2 rounded-xl ${focused ? "bg-primary/10" : ""}`}>
                <Globe color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
            ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
            tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center top-4 p-2 rounded-xl ${focused ? "bg-primary/10" : ""}`}>
                <Database color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
            ),
        }}
      />
    </Tabs>
  );
}
