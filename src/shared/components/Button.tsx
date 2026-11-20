import { Button as BaseButton } from "@base-ui/react/button";
import { ButtonHTMLAttributes } from "react";

const buttonVariant = {
  primary: "bg-accent-700 enabled:hover:bg-accent-800 text-white",
  secondary:
    "bg-white enabled:hover:bg-neutral-50 border border-neutral-100 text-neutral-900 dark:bg-zinc-900 dark:enabled:hover:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100",
  ghost:
    "bg-transparent enabled:hover:bg-neutral-50 text-neutral-900 dark:text-zinc-100 dark:enabled:hover:bg-zinc-800",
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
      className={`flex justify-center items-center h-10 px-4 py-2 gap-2 rounded-lg font-inter font-medium text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed  ${buttonVariant[variant]} ${className}`}
      {...props}
    >
      {children}
    </BaseButton>
  );
}
