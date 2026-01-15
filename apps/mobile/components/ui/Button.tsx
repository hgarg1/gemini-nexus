import { Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { cn } from '../../lib/utils';
import { MotiView } from 'moti';

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  label: string;
  icon?: React.ReactNode;
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  label, 
  icon,
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseStyles = "flex-row items-center justify-center rounded-2xl active:opacity-80";
  
  const variants = {
    primary: "bg-blue-600 shadow-lg shadow-blue-900/50 border border-blue-500/20",
    secondary: "bg-zinc-800 border border-zinc-700",
    outline: "bg-transparent border border-zinc-700",
    ghost: "bg-transparent",
  };

  const sizes = {
    sm: "px-4 py-2",
    md: "px-6 py-4",
    lg: "px-8 py-5",
  };

  const textStyles = {
    primary: "text-white font-bold text-base",
    secondary: "text-zinc-100 font-medium text-base",
    outline: "text-zinc-300 font-medium text-base",
    ghost: "text-zinc-400 font-medium text-sm",
  };

  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: props.onPressIn ? 0.98 : 1 }}
      transition={{ type: 'timing', duration: 100 }}
    >
      <TouchableOpacity 
        className={cn(baseStyles, variants[variant], sizes[size], disabled && "opacity-50", className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'outline' ? '#a1a1aa' : 'white'} />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text className={cn(textStyles[variant])}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}
