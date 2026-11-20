import { TextareaHTMLAttributes, forwardRef } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          min-h-24 w-full px-3 py-2
          rounded-lg
          border border-zinc-300
          bg-white
          font-sans text-[14px] not-italic font-medium
          leading-[15.5px] tracking-[0.4px]
          text-zinc-900
          placeholder:text-zinc-500
          outline-none
          resize-y
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
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
