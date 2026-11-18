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
          border border-neutral-100
          bg-white
          font-[Inter] text-[14px] not-italic font-medium
          leading-[15.5px] tracking-[0.4px]
          text-neutral-900
          placeholder:text-neutral-400
          outline-none
          resize-y
          focus:border-accent-700
          focus:ring-1
          focus:ring-accent-700
          ${className}
        `}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
