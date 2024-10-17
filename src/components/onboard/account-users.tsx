import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Checkbox, CheckboxGroup } from "@nextui-org/checkbox";

import { User } from "@/data";

export const AccountUsers = ({ users, setUsers }: { users: User[]; setUsers: (users: User[]) => void }) => {
  const handleAddUser = () => {
    setUsers([
      ...users,
      {
        id: users.length + 1,
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        role: "representative",
      },
    ]);
  };

  const handleInputChange = (id: number, field: keyof User, value: string) => {
    setUsers(users.map((user) => (user.id === id ? { ...user, [field]: value } : user)));
  };

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  return (
    <div className="space-y-4 overflow-y-auto">
      {users.map((user) => (
        <div key={user.id} className="space-y-4">
          <h1 className="text-lg font-bold">User {user.id}</h1>
          <Input
            label="First Name"
            placeholder="Enter first name"
            fullWidth
            value={user.firstName}
            onChange={(e) => handleInputChange(user.id, "firstName", e.target.value)}
          />
          <Input
            label="Last Name"
            placeholder="Enter last name"
            fullWidth
            value={user.lastName}
            onChange={(e) => handleInputChange(user.id, "lastName", e.target.value)}
          />
          <Input
            label="Email Address"
            placeholder="Enter email address"
            fullWidth
            value={user.email}
            onChange={(e) => handleInputChange(user.id, "email", e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="Enter phone number"
            fullWidth
            value={user.phoneNumber}
            onChange={(e) => handleInputChange(user.id, "phoneNumber", e.target.value)}
          />
          <CheckboxGroup
            description="A representative and ultimate beneficiary can log into the merchant portal and manage the merchant account. A representative is not a legal representative of the merchant, but a person who is authorized to act on behalf of the merchant."
            defaultValue={["representative"]}
          >
            <Checkbox value="representative">Representative?</Checkbox>
            <Checkbox value="ultimate_beneficiary">Ultimate Beneficiary?</Checkbox>
          </CheckboxGroup>
          <Button onClick={() => handleDeleteUser(user.id)} color="danger">
            Delete User
          </Button>
        </div>
      ))}
      <div className="flex justify-between space-x-4">
        <Button onClick={handleAddUser} className="bg-ualert-500">
          Add User
        </Button>
      </div>
    </div>
  );
};
