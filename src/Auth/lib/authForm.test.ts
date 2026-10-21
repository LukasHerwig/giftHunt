import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorField, authErrorKey, validateAuthForm } from './authForm.ts';

test('an empty e-mail is required, whitespace does not count', () => {
  assert.equal(validateAuthForm('signIn', '', 'secret1').email, 'emailRequired');
  assert.equal(validateAuthForm('signIn', '   ', 'secret1').email, 'emailRequired');
});

test('an e-mail without an @ and a dot is invalid', () => {
  assert.equal(validateAuthForm('signIn', 'erik', 'secret1').email, 'emailInvalid');
  assert.equal(validateAuthForm('signIn', 'erik@x', 'secret1').email, 'emailInvalid');
  assert.equal(validateAuthForm('signIn', ' erik@x.se ', 'secret1').email, undefined);
});

test('an empty password is required in both modes', () => {
  assert.equal(validateAuthForm('signIn', 'e@x.se', '').password, 'passwordRequired');
  assert.equal(validateAuthForm('signUp', 'e@x.se', '').password, 'passwordRequired');
});

test('a short password is refused when signing up, not when signing in', () => {
  assert.equal(validateAuthForm('signUp', 'e@x.se', '12345').password, 'passwordTooShort');
  assert.equal(validateAuthForm('signUp', 'e@x.se', '123456').password, undefined);
  assert.equal(validateAuthForm('signIn', 'e@x.se', '12345').password, undefined);
});

test('a valid form has no errors', () => {
  assert.deepEqual(validateAuthForm('signIn', 'e@x.se', 'secret1'), {});
});

test('server messages map to an error key', () => {
  assert.equal(authErrorKey('Invalid login credentials'), 'invalidCredentials');
  assert.equal(authErrorKey('User already registered'), 'alreadyRegistered');
  assert.equal(authErrorKey('Email not confirmed'), 'emailNotConfirmed');
  assert.equal(authErrorKey('boom'), 'generic');
  assert.equal(authErrorKey(undefined), 'generic');
});

test('an error shows under the field it is about', () => {
  assert.equal(authErrorField('alreadyRegistered'), 'email');
  assert.equal(authErrorField('emailNotConfirmed'), 'email');
  assert.equal(authErrorField('invalidCredentials'), 'password');
  assert.equal(authErrorField('generic'), 'password');
});
