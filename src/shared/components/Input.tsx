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
        border border-zinc-300
        bg-white
        font-sans text-[14px] not-italic font-medium
        leading-[15.5px] tracking-[0.4px]
        text-zinc-900
        placeholder:text-zinc-500
        outline-none
        focus:border-violet-600
        focus:ring-1
        focus:ring-violet-600
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
