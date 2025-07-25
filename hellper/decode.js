import * as crypto from 'crypto';


export function decodeToken(encryptedData) {
    const SECRET_KEY = '9f9b663e7993467c964af277fb4f8e61812fa8372927197bd99d6ac25e2d6858';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');

    // Kiểm tra độ dài IV
    if (iv.length !== 16) {
        throw new Error('Invalid IV length');
    }

    const encrypted = parts[1];
    const key = Buffer.from(SECRET_KEY.padEnd(32, '0').slice(0, 32), 'utf-8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}