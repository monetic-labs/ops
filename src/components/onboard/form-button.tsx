import { Button, ButtonProps } from "@nextui-org/button";

export const FormButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      {...props}
      className="bg-ualert-500 text-notpurple-100 hover:bg-ualert-600 rounded-md px-6 py-2 font-semibold transition-colors duration-200"
    />
  );
};
