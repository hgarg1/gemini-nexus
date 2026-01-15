import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { Cpu, Key } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { saveApiKey } from "../lib/api";

cssInterop(BlurView, { className: "style" });

export default function LoginScreen() {
  const router = useRouter();
  const pulse = useSharedValue(1);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.5 + (pulse.value - 1) * 2,
  }));

  const handleLogin = async () => {
    if (!apiKey.trim()) return;
    await saveApiKey(apiKey.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/chat");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <View className="flex-1 bg-background relative justify-center items-center">
        <LinearGradient
          colors={["#00f2ff10", "transparent", "#7000ff10"]}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
        
        <View className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <View className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl opacity-50" />

        <Animated.View entering={FadeInUp.delay(200).springify()} className="items-center mb-16">
          <Animated.View style={[animatedLogoStyle]} className="mb-8">
              <View className="w-24 h-24 bg-primary/10 rounded-3xl items-center justify-center border border-primary/40 shadow-2xl shadow-primary/50">
                  <Cpu color="#00f2ff" size={48} />
              </View>
          </Animated.View>
          
          <Text className="text-white text-5xl font-black tracking-tighter shadow-lg shadow-primary">NEXUS</Text>
          <Text className="text-primary text-[10px] tracking-[0.6em] font-bold mt-3 opacity-80">MOBILE TERMINAL v2.0</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} className="w-full px-10 space-y-4">
          <BlurView intensity={20} tint="dark" className="overflow-hidden rounded-2xl border border-white/10 flex-row items-center px-4">
              <Key color="rgba(255,255,255,0.3)" size={18} />
              <TextInput 
                  placeholder="ENTER NEURAL KEY" 
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                  value={apiKey}
                  onChangeText={setApiKey}
                  className="flex-1 py-5 ml-3 text-white font-mono tracking-wider text-xs"
              />
          </BlurView>

          <BlurView intensity={20} tint="dark" className="overflow-hidden rounded-2xl border border-white/10 mt-2">
              <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={handleLogin}
                  disabled={!apiKey.trim()}
                  className={`w-full py-5 items-center justify-center ${apiKey.trim() ? 'bg-primary/20' : 'bg-white/5'}`}
              >
                  <Text className={`font-bold tracking-widest text-xs ${apiKey.trim() ? 'text-primary' : 'text-white/20'}`}>INITIALIZE UPLINK</Text>
              </TouchableOpacity>
          </BlurView>

          <Text className="text-white/20 text-center text-[9px] tracking-[0.3em] uppercase mt-4">
              Secure Connection // Encrypted
          </Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}