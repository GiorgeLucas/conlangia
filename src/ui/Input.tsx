import { Input as BaseInput } from "@base-ui/react/input";
import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <BaseInput
      className={`
        h-10 px-3 py-2 gap-2
        flex items-center
        rounded-lg
        border border-neutral-100
        bg-white
        font-[Inter] text-[14px] not-italic font-medium
        leading-[15.5px] tracking-[0.4px]
        text-neutral-900
        placeholder:text-neutral-400
        outline-none
        focus:border-accent-700
        focus:ring-1
        focus:ring-accent-700
        dark:border-zinc-800
        dark:bg-zinc-900
        dark:text-zinc-100
        dark:placeholder:text-zinc-500
        ${className}
      `}
      {...props}
    />
  );
}
