import { Button as BaseButton } from "@base-ui/react/button";
import { ButtonHTMLAttributes } from "react";

const buttonVariant = {
  primary: "bg-violet-700 enabled:hover:bg-violet-800 text-white",
  secondary:
    "bg-white enabled:hover:bg-zinc-200 border border-zinc-300 text-zinc-900 dark:bg-zinc-900 dark:enabled:hover:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100",
  ghost:
    "bg-transparent enabled:hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100 dark:enabled:hover:bg-zinc-800",
  danger: "bg-red-600 enabled:hover:bg-red-700 text-white",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariant;
  shortcut?: string;
};

export default function Button({
  variant = "primary",
  shortcut,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={`flex justify-center items-center h-10 px-4 py-2 gap-2 rounded-lg font-sans font-medium text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed  ${buttonVariant[variant]} ${className}`}
      {...props}
    >
      {children}
    </BaseButton>
  );
}
