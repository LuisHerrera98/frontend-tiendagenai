/**
 * Utilidad para ordenar talles de forma lógica
 *
 * Orden de talles con letras:
 * XXS → XS → S → M → L → XL → XXL/2XL → XXXL/3XL → XXXXL/4XL → XXXXXL/5XL → XXXXXXL/6XL
 *
 * Orden de talles numéricos:
 * 0, 1, 2, ..., 100 (orden ascendente)
 */

// Definir el orden exacto de talles con letras
const SIZE_ORDER: Record<string, number> = {
  'XXS': 1,
  'XS': 2,
  'S': 3,
  'M': 4,
  'L': 5,
  'XL': 6,
  'XXL': 7,
  '2XL': 7,  // Mismo valor que XXL
  'XXXL': 8,
  '3XL': 8,  // Mismo valor que XXXL
  'XXXXL': 9,
  '4XL': 9,  // Mismo valor que XXXXL
  'XXXXXL': 10,
  '5XL': 10, // Mismo valor que XXXXXL
  'XXXXXXL': 11,
  '6XL': 11, // Mismo valor que XXXXXXL
}

/**
 * Determina si un talle es numérico
 */
function isNumericSize(sizeName: string): boolean {
  return /^\d+(\.\d+)?$/.test(sizeName.trim())
}

/**
 * Extrae el valor numérico de un talle
 */
function getNumericValue(sizeName: string): number {
  const parsed = parseFloat(sizeName.trim())
  return isNaN(parsed) ? Infinity : parsed
}

/**
 * Obtiene el valor de orden para talles con letras
 */
function getLetterSizeOrder(sizeName: string): number {
  const upperName = sizeName.trim().toUpperCase()
  return SIZE_ORDER[upperName] || Infinity
}

/**
 * Compara dos talles y retorna el orden correcto
 * @returns número negativo si a < b, positivo si a > b, 0 si son iguales
 */
export function compareSizes(a: string, b: string): number {
  const aIsNumeric = isNumericSize(a)
  const bIsNumeric = isNumericSize(b)

  // Si ambos son numéricos, ordenar numéricamente
  if (aIsNumeric && bIsNumeric) {
    return getNumericValue(a) - getNumericValue(b)
  }

  // Si ambos son de letras, usar el orden predefinido
  if (!aIsNumeric && !bIsNumeric) {
    const orderA = getLetterSizeOrder(a)
    const orderB = getLetterSizeOrder(b)

    // Si ambos tienen orden definido, comparar
    if (orderA !== Infinity && orderB !== Infinity) {
      return orderA - orderB
    }

    // Si solo uno tiene orden definido, ese va primero
    if (orderA !== Infinity) return -1
    if (orderB !== Infinity) return 1

    // Si ninguno tiene orden definido, ordenar alfabéticamente
    return a.localeCompare(b)
  }

  // Si son de tipos diferentes, los numéricos van primero
  return aIsNumeric ? -1 : 1
}

/**
 * Ordena un array de objetos con talles por su propiedad 'name'
 */
export function sortSizes<T extends { name: string }>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => compareSizes(a.name, b.name))
}

/**
 * Ordena un array de objetos con talles por su propiedad 'size_name'
 */
export function sortSizesBySizeName<T extends { size_name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareSizes(a.size_name, b.size_name))
}

/**
 * Ordena un array de strings con nombres de talles
 */
export function sortSizeNames(sizeNames: string[]): string[] {
  return [...sizeNames].sort((a, b) => compareSizes(a, b))
}
