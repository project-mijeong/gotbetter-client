import LoginForm from '@components/auth/LoginForm';
import SubMenu from '@components/auth/SubMenu';
import AndroidSafeAreaView from '@components/common/AndroidSafeAreaView';
import ActionButton from '@components/common/btn/ActionButton';
import GoogleLoginButton from '@components/common/btn/GoogleLoginButton';
import { ErrorMessage } from '@components/common/message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { loginRequest, oauthLoginRequest } from 'api/auth';
import * as Google from 'expo-auth-session/providers/google';
import format from 'pretty-format';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RFValue } from 'react-native-responsive-fontsize';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Toast from 'react-native-root-toast';
import { useMutation } from 'react-query';
import styled from 'styled-components/native';

function LoginScreen() {
  const navigation = useNavigation();

  const authId = useRef('');
  const password = useRef('');

  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '771187190490-4d9d8ivudtv4lv3njdb8hhu08uuh1heu.apps.googleusercontent.com',
  });

  useEffect(() => {
    loginGoogle();
  }, [response]);

  async function loginGoogle() {
    if (response?.type !== 'success') return;

    const token = response.authentication.accessToken;

    if (!token) return;

    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = await response.json();

      const { id, email, name, picture } = user;
      try {
        const request = { id, email, name, picture };

        const response = await oauthLoginRequest(request);
        console.log(format(response.data));
        const { access_token, refresh_token } = response.data;
        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('refresh_token', refresh_token);

        Toast.show('로그인 성공', { duration: Toast.durations.SHORT });
        navigation.reset({ routes: [{ name: 'home-routes' }] });
      } catch {
        Toast.show('로그인 실패', { duration: Toast.durations.SHORT });
      }
    } catch {
      Toast.show('로그인 실패', { duration: Toast.durations.SHORT });
    }
  }

  const onChange = (name, value) => {
    switch (name) {
      case 'auth_id':
        authId.current = value;
        break;
      case 'password':
        password.current = value;
        break;
      default:
        break;
    }
  };

  const { mutate: login } = useMutation(() => loginRequest({ auth_id: authId.current, password: password.current }), {
    onError: (err) => {
      const { status } = err.response;
      console.log(format(err.response));
      setError(true);
      if (status === 400) {
        setMessage('모든 정보를 입력해 주세요.');
      }
      if (status === 404) {
        setMessage('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    },
    onSuccess: async (res) => {
      console.log(format(res.data));
      const { access_token, refresh_token } = res.data;
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);

      Toast.show('로그인 성공', { duration: Toast.durations.SHORT });
      navigation.reset({ routes: [{ name: 'home-routes' }] });
    },
  });

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <AndroidSafeAreaView>
        <Container>
          <Logo source={require('@assets/logo.png')} resizeMode="contain" />
          <LoginForm onChange={onChange}>
            <ErrorMessage error={error} message={message} />
          </LoginForm>
          <View style={{ marginTop: RFValue(12) }}>
            <ActionButton
              title={'로그인'}
              width={wp(90)}
              height={hp(8)}
              color={'#3333FF'}
              round={true}
              onPress={login}
            />
          </View>
          <MarginTopMiddle>
            <SubMenu />
          </MarginTopMiddle>
          <MarginTopHigh>
            <GoogleLoginButton onPress={() => promptAsync()} />
          </MarginTopHigh>
        </Container>
      </AndroidSafeAreaView>
    </KeyboardAwareScrollView>
  );
}

const Container = styled.View`
  justify-content: center;
  align-items: center;
`;

const Logo = styled.Image`
  width: ${wp(80)}px;
  height: ${hp(30)}px;

  justify-content: center;
  align-items: center;
`;

const MarginTopMiddle = styled.View`
  margin-top: ${RFValue(12)}px;
`;
const MarginTopHigh = styled.View`
  margin-top: ${RFValue(20)}px;
`;
export default LoginScreen;
