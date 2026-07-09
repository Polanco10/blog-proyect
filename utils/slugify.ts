// Genera un slug URL-safe a partir de un texto.
// Normaliza diacríticos (á → a, ñ → n), colapsa caracteres no alfanuméricos
// en guiones y elimina guiones al inicio/final.
function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export = slugify;
