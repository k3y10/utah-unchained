'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  auth,
  createAccountWithEmailPassword,
  signInWithEmailPassword,
  database,
  ref,
  set,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '@/utilities/firebaseClient';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: any;
  }
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [usePhone, setUsePhone] = useState(false);

  useEffect(() => {
    import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          // Persistence set successfully
        })
        .catch((error) => {
          console.error('Error setting persistence:', error);
        });
    });
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      // @ts-ignore: Argument of type 'string' is not assignable to parameter of type 'Auth'.
      window.recaptchaVerifier = new RecaptchaVerifier('sign-in-button', {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          handleSignUp();
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          setError('reCAPTCHA expired. Please try again.');
        },
      }, auth);
      window.recaptchaVerifier.render();
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      const position = await getCurrentPosition();
      if (!isWithinUtah(position.coords)) {
        setError('Sign-up is only allowed within the state of Utah.');
        setLoading(false);
        return;
      }

      if (usePhone) {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setVerificationId(confirmationResult.verificationId);
      } else {
        await createAccountWithEmailPassword(email, password);
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      setError('Error during sign up. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError('');
      const code = verificationCode;
      const confirmationResult = window.confirmationResult;
      const result = await confirmationResult.confirm(code);
      const user = result.user;

      await saveUserData(user.uid);
      window.location.href = '/home';
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Error verifying code. Please try again.');
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithEmailPassword(email, password);
      window.location.href = '/home';
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Error signing in. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const saveUserData = async (uid: string) => {
    try {
      await set(ref(database, `users/${uid}`), { uid });
    } catch (error) {
      console.error('Error saving user data:', error);
      setError('Error saving user data. Please try again.');
    }
  };

  const getCurrentPosition = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const isWithinUtah = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    const utahBounds = {
      north: 42.0,
      south: 37.0,
      west: -114.0,
      east: -109.0,
    };
    return (
      latitude >= utahBounds.south &&
      latitude <= utahBounds.north &&
      longitude >= utahBounds.west &&
      longitude <= utahBounds.east
    );
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <Image src="/utahflag.gif" alt="Company Logo" width={400} height={400} />
      <br />
      <h1 className="text-3xl mb-4 mt-8">Welcome to Utah Unchained</h1>
      <p className="text-sm text-center px-4">
        To create an account, you must be residing in the state of Utah. <br></br>Your geolocation will be verified using Google Mapping Services.
      </p>
      <br />
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex items-center justify-center mb-4">
          <span className="mr-2">Use a 385, 435, or 801 Phone Number</span>
          <div className="relative">
            <input
              type="checkbox"
              id="toggle"
              checked={usePhone}
              onChange={() => setUsePhone(!usePhone)}
              className="toggle-checkbox"
            />
            <label htmlFor="toggle" className="toggle-label">
              <span className="toggle-button"></span>
            </label>
          </div>
        </div>
        {!usePhone && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 text-black"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 text-black"
            />
          </>
        )}
        {usePhone && (
          <>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone Number"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 text-black"
            />
            {verificationId && (
              <>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Verification Code"
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 text-black"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="px-4 py-2 bg-black border-2 border-white text-white rounded-md hover:bg-utahgold focus:outline-none focus:ring focus:ring-blue-200"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </>
            )}
          </>
        )}
        <button
          id="sign-in-button"
          onClick={handleSignUp}
          disabled={loading}
          className="px-4 py-2 bg-black border-2 border-white text-white rounded-md hover:bg-utahgold focus:outline-none focus:ring focus:ring-blue-200"
        >
          {loading ? 'Processing...' : 'Sign Up'}
        </button>
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 bg-black border-2 border-white text-white rounded-md hover:bg-utahgold focus:outline-none focus:ring focus:ring-blue-200"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <div id="recaptcha-container"></div>
    </main>
  );
}
