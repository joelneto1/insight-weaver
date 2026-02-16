/**
 * Client-side encryption utility for sensitive data (passwords, secrets).
 * Uses AES-GCM via Web Crypto API.
 *
 * Security model:
 * - Encryption key is derived from user's UUID + app salt via PBKDF2
 * - Provides "encryption at rest" — DB dumps won't reveal plaintext passwords
 * - Gracefully handles legacy unencrypted data (fallback on decryption failure)
 *
 * For production-grade security, consider using a Supabase Edge Function
 * with a server-side secret for encryption/decryption.
 */

const APP_SALT = import.meta.env.VITE_CRYPTO_SALT || "darktube-insight-weaver-2026";

async function deriveKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(userId + APP_SALT),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(APP_SALT),
            iterations: 310000, // OWASP 2023 recommendation for SHA-256
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt plaintext using AES-GCM.
 * Returns a base64-encoded string containing the IV + ciphertext.
 */
export async function encryptText(
    plaintext: string,
    userId: string
): Promise<string> {
    const key = await deriveKey(userId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(plaintext)
    );
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded AES-GCM ciphertext.
 * Falls back to returning the input as-is if decryption fails
 * (handles legacy unencrypted data gracefully).
 */
export async function decryptText(
    ciphertext: string,
    userId: string
): Promise<string> {
    try {
        const key = await deriveKey(userId);
        const combined = Uint8Array.from(atob(ciphertext), (c) =>
            c.charCodeAt(0)
        );
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch {
        // Fallback: return as-is for legacy unencrypted data
        return ciphertext;
    }
}
