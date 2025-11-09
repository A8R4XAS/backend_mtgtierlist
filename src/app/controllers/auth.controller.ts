import { Context, hashPassword, HttpResponseConflict, HttpResponseNoContent, HttpResponseOK, HttpResponseUnauthorized, Post, ValidateBody, verifyPassword, Get } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
import { User, UserRole } from '../entities/index';
import { JwtService, JwtPayload } from '../services/jwt.service';

// Helper: JWT Payload erstellen
const createJwtPayload = (user: User): JwtPayload => ({
  sub: String(user.id),
  userId: user.id,
  email: user.email,
  role: user.role,
});

// Helper: Cookie-Optionen für Refresh Token
const getRefreshTokenCookieOptions = (rememberMe?: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
  path: '/',
});

// Helper: User Response mit Tokens erstellen
const createAuthResponse = (user: User, accessToken: string, refreshToken: string, rememberMe: boolean = true) => {
  const response = new HttpResponseOK({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
  });
  
  response.setCookie('refreshToken', refreshToken, getRefreshTokenCookieOptions(rememberMe));
  return response;
};

const credentialsSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string' },
    rememberMe: { type: 'boolean' }
  },
  required: [ 'email', 'password' ],
  additionalProperties: false,
};

const signUpSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', maxLength: 255 },
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string' }
  },
  required: ['name','email','password'],
  additionalProperties: false,
};

export class AuthController {

  @Post('/login')
  @ValidateBody(credentialsSchema)
  async login(ctx: Context) {

    const {email, password, rememberMe} = ctx.request.body;

    const user = await User.findOneBy({ email });
    if (!user) {
      return new HttpResponseUnauthorized('Bad credentials.');
    }

    if (!(await verifyPassword(password, user.password))) {
      return new HttpResponseUnauthorized();
    }

    // JWT Tokens generieren
    const payload = createJwtPayload(user);
    const { accessToken, refreshToken } = JwtService.generateTokenPair(payload);

    return createAuthResponse(user, accessToken, refreshToken, rememberMe);
  }

  @Post('/logout')
  async logout(ctx: Context) {
    // Refresh Token Cookie löschen
    const response = new HttpResponseNoContent();
    response.setCookie('refreshToken', '', {
      ...getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    return response;
  }

  @Post('/signup')
  @ValidateBody(signUpSchema)
  async signup(ctx: Context) {
  
    const {name, email, password} = ctx.request.body;

    // Effizienter Check ob User existiert
    const existingUser = await User.findOneBy({ email });
    if (existingUser) {
      return new HttpResponseConflict({'error': 'Email already registered'});
    }

    const user = new User();
    user.email = email;
    user.name = name;
    user.password = await hashPassword(password);
    user.role = UserRole.USER;
    await user.save();

    // JWT Tokens für den neuen User generieren
    const payload = createJwtPayload(user);
    const { accessToken, refreshToken } = JwtService.generateTokenPair(payload);

    return createAuthResponse(user, accessToken, refreshToken, true);
  }

  @Get('/validate-role')
  @JWTRequired()
  async validateRole(ctx: Context) {
    // @JWTRequired() hat bereits den Token validiert und ctx.user gesetzt
    const user = ctx.user as JwtPayload;
    return new HttpResponseOK({ 
      valid: true,
      role: user.role,
      userId: user.userId 
    });
  }

  @Post('/refresh-token')
  async refreshToken(ctx: Context) {
    try {
      const refreshToken = ctx.request.cookies.refreshToken;

      if (!refreshToken) {
        return new HttpResponseUnauthorized('Kein Refresh Token vorhanden');
      }

      // Refresh Token validieren
      const payload = JwtService.verifyRefreshToken(refreshToken);

      // Benutzer existiert noch?
      const user = await User.findOneBy({ id: payload.userId });

      if (!user) {
        return new HttpResponseUnauthorized('Benutzer nicht gefunden');
      }

      // Neuen Access Token generieren
      const newPayload = createJwtPayload(user);
      const accessToken = JwtService.generateAccessToken(newPayload);

      return new HttpResponseOK({ accessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      return new HttpResponseUnauthorized('Ungültiger Refresh Token');
    }
  }

}
