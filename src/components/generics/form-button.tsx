import { Button, ButtonProps } from "@nextui-org/button";

interface FormButtonProps extends ButtonProps {
  type?: "submit" | "button" | "reset";
}

export const FormButton: React.FC<FormButtonProps> = ({ type = "button", ...props }) => {
  return (
    <Button
      type={type}
      {...props}
      className="bg-ualert-500 text-notpurple-100 hover:bg-ualert-600 rounded-md px-6 py-2 font-semibold transition-colors duration-200"
    />
  );
};