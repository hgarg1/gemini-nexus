import { View, Image, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface AvatarProps {
  uri?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ uri, fallback, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <View className={cn("rounded-full overflow-hidden bg-zinc-800 items-center justify-center border border-zinc-700", sizes[size], className)}>
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text className={cn("font-bold text-zinc-400", textSizes[size])}>{fallback}</Text>
      )}
    </View>
  );
}
