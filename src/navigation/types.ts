export type PublicStackParamList = {
  Login: undefined;
  Registro: undefined;
};

export type AuthenticatedStackParamList = {
  Home: undefined;
  AltaProducto: undefined;
  DetalleProducto: { productId: string };
};
