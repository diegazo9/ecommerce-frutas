import * as XLSX from 'xlsx';

export interface ParsedProductRow {
  rowNumber: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  description: string;
  price2kg?: number | null;
  discount2kg?: number | null;
  price3kg?: number | null;
  discount3kg?: number | null;
  imageUrl?: string;
  isExisting?: boolean;
  status: 'valid' | 'warning' | 'error';
  statusMessage?: string;
}

export const downloadProductsExcelTemplate = (existingCategories: string[] = []) => {
  const headers = [
    'Nombre',
    'Categoria',
    'Precio',
    'Stock',
    'Unidad',
    'Descripcion',
    'Precio_2kg',
    'Descuento_2kg',
    'Precio_3kg',
    'Descuento_3kg',
    'Imagen_URL'
  ];

  const catExample1 = existingCategories[0] || 'Frutas';
  const catExample2 = existingCategories[1] || 'Verduras';
  const catExample3 = existingCategories[2] || 'Frutos Secos';

  const sampleData = [
    [
      'Manzana Roja Deliciosa',
      catExample1,
      2500,
      50,
      'kg',
      'Manzanas crujientes y dulces del Alto Valle',
      4700,
      6,
      6700,
      10,
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600'
    ],
    [
      'Banana Ecuador Premium',
      catExample1,
      2200,
      35,
      'kg',
      'Bananas maduras y listas para consumir',
      4000,
      9,
      5800,
      12,
      ''
    ],
    [
      'Palta Hass',
      catExample2,
      7500,
      15,
      'kg',
      'Paltas cremosas de excelente calibre',
      14000,
      6.5,
      20000,
      11,
      ''
    ],
    [
      'Nuez Pelada Mariposa',
      catExample3,
      12000,
      20,
      'kg',
      'Nueces mariposa seleccionadas extra',
      22000,
      8,
      32000,
      11,
      ''
    ],
    [
      'Naranja de Jugo',
      catExample1,
      1800,
      0,
      'kg',
      'Naranjas dulces con abundante jugo (Stock en 0 queda oculta hasta reponer)',
      3200,
      11,
      4600,
      15,
      ''
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Anchos de columnas sugeridos
  ws['!cols'] = [
    { wch: 28 }, // Nombre
    { wch: 18 }, // Categoria
    { wch: 12 }, // Precio
    { wch: 10 }, // Stock
    { wch: 10 }, // Unidad
    { wch: 45 }, // Descripcion
    { wch: 14 }, // Precio_2kg
    { wch: 16 }, // Descuento_2kg
    { wch: 14 }, // Precio_3kg
    { wch: 16 }, // Descuento_3kg
    { wch: 40 }, // Imagen_URL
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  // Descargar archivo
  XLSX.writeFile(wb, 'Plantilla_Productos_Vibranfrut.xlsx');
};

const normalizeHeaderKey = (raw: string): string => {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const parseNum = (val: any): number | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim().replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

export const parseProductsFile = async (
  file: File,
  existingProductNames: Set<string>
): Promise<ParsedProductRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('El archivo Excel no contiene ninguna hoja.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawRows.length < 2) {
          throw new Error('El archivo no contiene filas de datos (solo encabezados o vacío).');
        }

        const rawHeaders: string[] = rawRows[0].map((h: any) => String(h || '').trim());
        const headerMap: Record<string, number> = {};

        rawHeaders.forEach((h, index) => {
          const norm = normalizeHeaderKey(h);
          if (norm.includes('nombre') || norm.includes('producto') || norm === 'titulo' || norm === 'name') {
            headerMap['name'] = index;
          } else if (norm.includes('categoria') || norm.includes('category') || norm === 'rubro') {
            headerMap['category'] = index;
          } else if (norm.includes('precio2kg') || norm.includes('precio2k') || norm.includes('promo2kg')) {
            headerMap['price2kg'] = index;
          } else if (norm.includes('desc2kg') || norm.includes('descuento2kg') || norm.includes('porcentajedesc2kg')) {
            headerMap['discount2kg'] = index;
          } else if (norm.includes('precio3kg') || norm.includes('precio3k') || norm.includes('promo3kg')) {
            headerMap['price3kg'] = index;
          } else if (norm.includes('desc3kg') || norm.includes('descuento3kg') || norm.includes('porcentajedesc3kg')) {
            headerMap['discount3kg'] = index;
          } else if (norm.includes('precio') || norm.includes('price') || norm === 'valor' || norm === 'preciobase') {
            headerMap['price'] = index;
          } else if (norm.includes('stock') || norm.includes('cantidad') || norm.includes('kilos')) {
            headerMap['stock'] = index;
          } else if (norm.includes('unidad') || norm.includes('unit') || norm === 'medida') {
            headerMap['unit'] = index;
          } else if (norm.includes('descrip') || norm.includes('detalle')) {
            headerMap['description'] = index;
          } else if (norm.includes('imagen') || norm.includes('foto') || norm.includes('image') || norm.includes('url')) {
            headerMap['imageUrl'] = index;
          }
        });

        if (headerMap['name'] === undefined) {
          throw new Error('No se encontró la columna "Nombre" o "Producto" en el encabezado del archivo.');
        }

        const parsedProducts: ParsedProductRow[] = [];

        for (let r = 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          // Si la fila está completamente vacía, omitir
          if (!row || row.every((cell: any) => cell === '' || cell === null || cell === undefined)) {
            continue;
          }

          const cleanCellStr = (val: any) => String(val || '').replace(/[;,]+$/, '').trim();

          const rawName = headerMap['name'] !== undefined ? cleanCellStr(row[headerMap['name']]) : '';
          const rawCategory = headerMap['category'] !== undefined ? cleanCellStr(row[headerMap['category']]) : 'General';
          const rawPrice = headerMap['price'] !== undefined ? parseNum(row[headerMap['price']]) : null;
          const rawStock = headerMap['stock'] !== undefined ? parseNum(row[headerMap['stock']]) : 0;
          const rawUnit = headerMap['unit'] !== undefined ? cleanCellStr(row[headerMap['unit']]) || 'kg' : 'kg';
          const rawDescription = headerMap['description'] !== undefined ? cleanCellStr(row[headerMap['description']]) : '';
          const rawPrice2kg = headerMap['price2kg'] !== undefined ? parseNum(row[headerMap['price2kg']]) : null;
          const rawDiscount2kg = headerMap['discount2kg'] !== undefined ? parseNum(row[headerMap['discount2kg']]) : null;
          const rawPrice3kg = headerMap['price3kg'] !== undefined ? parseNum(row[headerMap['price3kg']]) : null;
          const rawDiscount3kg = headerMap['discount3kg'] !== undefined ? parseNum(row[headerMap['discount3kg']]) : null;
          const rawImageUrl = headerMap['imageUrl'] !== undefined ? cleanCellStr(row[headerMap['imageUrl']]) : '';

          let status: 'valid' | 'warning' | 'error' = 'valid';
          let statusMessage = '';

          if (!rawName) {
            status = 'error';
            statusMessage = 'Nombre vacío';
          } else if (rawPrice === null || rawPrice < 0) {
            status = 'error';
            statusMessage = 'Precio inválido o faltante';
          } else if (rawStock === null || rawStock < 0) {
            status = 'error';
            statusMessage = 'Stock inválido (debe ser >= 0)';
          }

          const isExisting = rawName ? existingProductNames.has(rawName.toLowerCase()) : false;

          if (status === 'valid') {
            if (rawStock === 0) {
              status = 'warning';
              statusMessage = isExisting ? 'Actualiza (Stock 0: se ocultará en web)' : 'Nuevo (Stock 0: se ocultará en web)';
            } else {
              statusMessage = isExisting ? 'Actualizará producto existente' : 'Nuevo producto a crear';
            }
          }

          parsedProducts.push({
            rowNumber: r + 1,
            name: rawName,
            category: rawCategory || 'General',
            price: rawPrice ?? 0,
            stock: rawStock ?? 0,
            unit: rawUnit || 'kg',
            description: rawDescription,
            price2kg: rawPrice2kg,
            discount2kg: rawDiscount2kg,
            price3kg: rawPrice3kg,
            discount3kg: rawDiscount3kg,
            imageUrl: rawImageUrl,
            isExisting,
            status,
            statusMessage
          });
        }

        resolve(parsedProducts);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
