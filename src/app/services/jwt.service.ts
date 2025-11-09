import { sign, verify } from 'jsonwebtoken';
import { getSecretOrPrivateKey } from '@foal/jwt';
import { Config } from '@foal/core';

const getRefreshSecret = () => {
  return Config.get('settings.jwt.refreshSecret', 'string', 'mtg-tierlist-refresh-secret-fallback-min-32-chars');
};

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 Minuten
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 Tage

export interface JwtPayload {
  sub: string;      // FoalTS Standard: subject (user id als string)
  userId: number;   // Für Kompatibilität
  email: string;
  role: string;
}

export class JwtService {
  // Access Token generieren (kurzlebig) - verwendet official FoalTS secret
  static generateAccessToken(payload: JwtPayload): string {
    // Stelle sicher, dass sub als string vorhanden ist (FoalTS Requirement)
    const tokenPayload = {
      ...payload,
      sub: payload.sub || String(payload.userId)
    };
    
    return sign(tokenPayload, getSecretOrPrivateKey(), {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  // Refresh Token generieren (langlebig) - verwendet separates Secret
  static generateRefreshToken(payload: JwtPayload): string {
    // Stelle sicher, dass sub als string vorhanden ist
    const tokenPayload = {
      ...payload,
      sub: payload.sub || String(payload.userId)
    };
    
    return sign(tokenPayload, getRefreshSecret(), {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  }

  // Access Token validieren - verwendet official FoalTS secret
  static verifyAccessToken(token: string): JwtPayload {
    try {
      return verify(token, getSecretOrPrivateKey()) as JwtPayload;
    } catch (error) {
      throw new Error('Ungültiger Access Token');
    }
  }

  // Refresh Token validieren - verwendet separates Secret
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return verify(token, getRefreshSecret()) as JwtPayload;
    } catch (error) {
      throw new Error('Ungültiger Refresh Token');
    }
  }

  // Token Pair generieren
  static generateTokenPair(payload: JwtPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}
