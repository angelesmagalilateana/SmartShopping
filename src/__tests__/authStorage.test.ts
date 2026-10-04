import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession, getUser, removeSession, saveSession, saveUser } from '../storage/authStorage';
import { STORAGE_KEYS } from '../storage/keys';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('almacenamiento de autenticación', () => {
  it('devuelve null cuando no hay usuario ni sesión', async () => {
    expect(await getUser()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it('recupera el usuario guardado', async () => {
    const user = { username: 'ana', password: 'clave' };
    await saveUser(user);
    expect(await getUser()).toEqual(user);
  });

  it('recupera la sesión guardada', async () => {
    await saveSession({ username: 'ana' });
    expect(await getSession()).toEqual({ username: 'ana' });
  });

  it('elimina la sesión y conserva el usuario y los productos', async () => {
    const user = { username: 'ana', password: 'clave' };
    await saveUser(user);
    await saveSession({ username: 'ana' });
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, '[]');
    await removeSession();
    expect(await getSession()).toBeNull();
    expect(await getUser()).toEqual(user);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS)).toBe('[]');
  });

  it.each(['{', 'null', '{}', '{"username":"   "}'])(
    'rechaza una sesión inválida: %s',
    async (value) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, value);
      expect(await getSession()).toBeNull();
    }
  );

  it.each(['{', 'null', '{}', '{"username":"ana","password":""}'])(
    'rechaza un usuario inválido: %s',
    async (value) => {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, value);
      expect(await getUser()).toBeNull();
    }
  );

  it('propaga un fallo de lectura para que la app pueda informar el error', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Lectura fallida'));
    await expect(getSession()).rejects.toThrow('Lectura fallida');
  });
});
