import { describe, expect, it } from '@jest/globals';
import {
  isProductNameValid,
  isQuantityValid,
  isRequiredFieldValid,
} from '../utils/validation';

describe('isProductNameValid', () => {
  it('acepta un nombre de producto', () => {
    expect(isProductNameValid('Leche')).toBe(true);
  });

  it('rechaza un nombre vacío', () => {
    expect(isProductNameValid('')).toBe(false);
  });

  it('rechaza un nombre compuesto solo por espacios', () => {
    expect(isProductNameValid('   ')).toBe(false);
  });

  it('rechaza un nombre compuesto solo por tabulaciones y saltos de línea', () => {
    expect(isProductNameValid('\t\n')).toBe(false);
  });

  it('acepta un nombre con espacios alrededor', () => {
    expect(isProductNameValid('  Pan  ')).toBe(true);
  });
});

describe('isRequiredFieldValid', () => {
  it.each(['', '   ', '\t\n'])('rechaza el campo vacío %j', (value) => {
    expect(isRequiredFieldValid(value)).toBe(false);
  });

  it('acepta un campo con contenido', () => {
    expect(isRequiredFieldValid('usuario')).toBe(true);
  });
});

describe('isQuantityValid', () => {
  it.each([1, 3])('acepta la cantidad entera positiva %s', (quantity) => {
    expect(isQuantityValid(quantity)).toBe(true);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rechaza la cantidad inválida %s', (quantity) => {
    expect(isQuantityValid(quantity)).toBe(false);
  });
});
