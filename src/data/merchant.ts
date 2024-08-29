export interface Representative {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
}

export interface RegisteredAddress {
  street1: string;
  street2?: string;
  city: string;
  postcode?: string;
  state?: string;
  country: string;
}

export interface Company {
  name: string;
  email: string;
  registeredAddress: RegisteredAddress;
}

export interface MerchantFormData {
  walletAddress: string;
  representatives: Representative[];
  company: Company;
}
