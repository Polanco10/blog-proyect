/**
 * Blacklist de tokens JWT en memoria.
 * Los tokens se almacenan con su expiración para que el Map no crezca sin límite.
 * Al reiniciar el servidor la blacklist se limpia — aceptable a esta escala
 * ya que los tokens expiran en 90d y los reinicios son poco frecuentes.
 */

// token → timestamp de expiración en ms
const blacklist = new Map<string, number>();

export const addToBlacklist = (token: string, expiresAtMs: number): void => {
    blacklist.set(token, expiresAtMs);
};

export const isBlacklisted = (token: string): boolean => {
    const exp = blacklist.get(token);
    if (exp === undefined) return false;
    // Si el token ya expiró naturalmente, eliminarlo y tratarlo como no bloqueado
    if (Date.now() > exp) {
        blacklist.delete(token);
        return false;
    }
    return true;
};

// Purgar entradas expiradas cada hora para mantener el consumo de memoria mínimo
setInterval(
    () => {
        const now = Date.now();
        for (const [token, exp] of blacklist.entries()) {
            if (now > exp) blacklist.delete(token);
        }
    },
    60 * 60 * 1000
).unref(); // unref() para que este timer no mantenga el proceso vivo en tests
