/**
 * Fusionne deux jeux de notes { slug: { note, coeur, commentaire, maj } } :
 * pour chaque groupe, l'avis le plus récent (champ maj) l'emporte.
 *
 * @template {{ maj?: string }} T
 * @param {Record<string, T>} [a={}]
 * @param {Record<string, T>} [b={}]
 * @returns {Record<string, T>}
 */
export function fusionner(a = {}, b = {}) {
  /** @type {Record<string, T>} */
  const resultat = { ...a };
  for (const [slug, avis] of Object.entries(b)) {
    const actuel = resultat[slug];
    if (!actuel || (avis.maj ?? '') > (actuel.maj ?? '')) {
      resultat[slug] = avis;
    }
  }
  return resultat;
}
