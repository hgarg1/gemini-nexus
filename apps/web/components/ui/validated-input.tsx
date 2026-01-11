"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validate?: (value: string) => string | null; // returns error message or null
  asyncValidate?: (value: string) => Promise<string | null>;
  icon?: React.ReactNode;
}

export function ValidatedInput({ 
  label, 
  validate, 
  asyncValidate, 
  icon, 
  className,
  value,
  onChange,
  ...props 
}: ValidatedInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleValidation = async (val: string) => {
    if (!touched) return;
    
    let err = validate ? validate(val) : null;
    
    if (!err && asyncValidate && val) {
      setIsValidating(true);
      err = await asyncValidate(val);
      setIsValidating(false);
    }

    setError(err);
    setIsSuccess(!err && touched && val.length > 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleValidation(String(value || ""));
    }, 500);
    return () => clearTimeout(timer);
  }, [value, touched]);

  return (
    <div className={cn("space-y-2 group", className)}>
      <label className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
        {icon} {label}
      </label>
      
      <div className="relative">
        <motion.div
          animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <input
            {...props}
            value={value}
            onChange={onChange}
            onBlur={() => setTouched(true)}
            className={cn(
              "cyber-input w-full transition-all duration-300",
              error ? "border-red-500/50 bg-red-500/5 focus:border-red-500" : 
              isSuccess ? "border-green-500/50 bg-green-500/5 focus:border-green-500" : ""
            )}
          />
        </motion.div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isValidating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-red-500"
              >
                <AlertCircle className="w-4 h-4" />
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-green-500"
              >
                <CheckCircle2 className="w-4 h-4" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="text-[10px] font-bold text-red-500 tracking-wider uppercase pl-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
