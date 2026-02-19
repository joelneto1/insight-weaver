/**
 * Server-side encryption utility for sensitive data (passwords, secrets).
 * Uses a Supabase Edge Function with AES-GCM via Web Crypto API.
 *
 * Security model:
 * - Encryption key is derived from user's UUID + server-side salt via PBKDF2
 * - Salt is NEVER exposed to the client (stored only in Edge Function env)
 * - Provides "encryption at rest" — DB dumps won't reveal plaintext passwords
 * - Gracefully handles legacy unencrypted data (fallback on decryption failure)
 * - JWT authentication required for all requests
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Encrypt plaintext using server-side AES-GCM via Edge Function.
 * Returns a base64-encoded string containing the IV + ciphertext.
 */
export async function encryptText(
    plaintext: string,
    userId: string
): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error("Not authenticated");
    }

    const response = await supabase.functions.invoke("crypto-service", {
        body: {
            action: "encrypt",
            text: plaintext,
            userId,
        },
    });

    if (response.error) {
        console.error("Encryption error:", response.error);
        throw new Error("Failed to encrypt data");
    }

    return response.data.result;
}

/**
 * Decrypt a base64-encoded AES-GCM ciphertext via Edge Function.
 * Falls back to returning the input as-is if decryption fails
 * (handles legacy unencrypted data gracefully).
 */
export async function decryptText(
    ciphertext: string,
    userId: string
): Promise<string> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            // If not authenticated, return as-is (legacy fallback)
            return ciphertext;
        }

        const response = await supabase.functions.invoke("crypto-service", {
            body: {
                action: "decrypt",
                text: ciphertext,
                userId,
            },
        });

        if (response.error) {
            console.error("Decryption error:", response.error);
            return ciphertext; // fallback for legacy data
        }

        return response.data.result;
    } catch {
        // Fallback: return as-is for legacy unencrypted data
        return ciphertext;
    }
}

/**
 * Batch decrypt multiple texts in a single request (optimized for lists).
 * Returns a map of id -> decrypted text.
 */
export async function decryptBatch(
    items: Array<{ id: string; text: string | null }>,
    userId: string
): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    // Filter out null items
    const toDecrypt = items.filter(item => item.text != null);
    const nullItems = items.filter(item => item.text == null);

    // Set null items immediately
    nullItems.forEach(item => result.set(item.id, null));

    if (toDecrypt.length === 0) return result;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            toDecrypt.forEach(item => result.set(item.id, item.text));
            return result;
        }

        const response = await supabase.functions.invoke("crypto-service", {
            body: {
                action: "decrypt_batch",
                items: toDecrypt.map(item => ({ id: item.id, text: item.text })),
                userId,
            },
        });

        if (response.error) {
            console.error("Batch decryption error:", response.error);
            toDecrypt.forEach(item => result.set(item.id, item.text));
            return result;
        }

        // Map results back
        for (const item of response.data.results) {
            result.set(item.id, item.result);
        }

        return result;
    } catch {
        // Fallback: return as-is
        toDecrypt.forEach(item => result.set(item.id, item.text));
        return result;
    }
}
