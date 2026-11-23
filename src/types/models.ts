export type User = {
  username: string;
  password: string;
};

export type Session = {
  username: string;
};

export type Product = {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  photoUri?: string;
  location?: ProductLocation;
};

export type ProductLocation = { latitude: number; longitude: number };
