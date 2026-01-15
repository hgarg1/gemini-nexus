import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ className, label, error, icon, onFocus, onBlur, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="space-y-2">
      {label && <Text className="text-zinc-400 text-sm font-medium ml-1">{label}</Text>}
      <View 
        className={cn(
          "flex-row items-center bg-zinc-900/50 border rounded-2xl px-4 py-3.5",
          isFocused ? "border-blue-500/50 bg-zinc-900" : "border-zinc-800",
          error && "border-red-500/50",
          className
        )}
      >
        {icon && <View className="mr-3 opacity-60">{icon}</View>}
        <TextInput
          className="flex-1 text-white text-base placeholder:text-zinc-600"
          placeholderTextColor="#52525b"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && <Text className="text-red-400 text-xs ml-1">{error}</Text>}
    </View>
  );
}
