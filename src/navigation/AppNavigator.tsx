import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddProductScreen from '../screens/AddProductScreen';
import type { Session } from '../types/models';
import type { AuthenticatedStackParamList, PublicStackParamList } from './types';

const PublicStack = createNativeStackNavigator<PublicStackParamList>();
const AuthenticatedStack = createNativeStackNavigator<AuthenticatedStackParamList>();

type Props = {
  session: Session | null;
  onLogin: (session: Session) => void;
  onLogout: () => Promise<void>;
};

export default function AppNavigator({ session, onLogin, onLogout }: Props) {
  return (
    <NavigationContainer>
      {session ? (
        <AuthenticatedStack.Navigator>
          <AuthenticatedStack.Screen name="Home" options={{ title: 'SmartShopping' }}>
            {(props) => <HomeScreen {...props} session={session} onLogout={onLogout} />}
          </AuthenticatedStack.Screen>
          <AuthenticatedStack.Screen name="AltaProducto" component={AddProductScreen} options={{ title: 'Alta de producto' }} />
        </AuthenticatedStack.Navigator>
      ) : (
        <PublicStack.Navigator>
          <PublicStack.Screen name="Login" options={{ title: 'Iniciar sesión' }}>
            {(props) => <LoginScreen {...props} onLogin={onLogin} />}
          </PublicStack.Screen>
          <PublicStack.Screen name="Registro" component={RegisterScreen} options={{ title: 'Registro' }} />
        </PublicStack.Navigator>
      )}
    </NavigationContainer>
  );
}
