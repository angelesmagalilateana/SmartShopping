export function isRequiredFieldValid(value: string): boolean {
  return value.trim().length > 0;
}

export function isProductNameValid(name: string): boolean {
  return isRequiredFieldValid(name);
}

export function isQuantityValid(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}
