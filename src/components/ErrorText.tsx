interface ErrorTextProps {
  text: string;
}

export const ErrorText = ({ text }: ErrorTextProps) => (
  <p className="!m-0 !text-[11px] !text-red-500 !mt-[1px]">
    {text}
  </p>
);
