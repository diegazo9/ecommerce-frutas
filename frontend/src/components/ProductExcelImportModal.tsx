import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  downloadProductsExcelTemplate, 
  parseProductsFile, 
  type ParsedProductRow 
} from '../utils/excelTemplate';
import { 
  bulkImportProducts, 
  createProduct, 
  updateProduct, 
  createCategory, 
  type BulkImportResponse, 
  type Product 
} from '../services/api';

interface ProductExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProducts: Product[];
  categories: { id: number; name: string }[];
}

export const ProductExcelImportModal = ({
  isOpen,
  onClose,
  onSuccess,
  existingProducts,
  categories
}: ProductExcelImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingNamesSet = new Set(existingProducts.map(p => p.name.trim().toLowerCase()));

  const handleDownloadTemplate = () => {
    const catNames = categories.map(c => c.name);
    downloadProductsExcelTemplate(catNames);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const rows = await parseProductsFile(selectedFile, existingNamesSet);
      setParsedRows(rows);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Error al procesar el archivo Excel.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validRows = parsedRows.filter(r => r.status === 'valid' || r.status === 'warning');
  const errorRows = parsedRows.filter(r => r.status === 'error');
  const warningRows = parsedRows.filter(r => r.status === 'warning');
  const newProductsCount = validRows.filter(r => !r.isExisting).length;
  const updateProductsCount = validRows.filter(r => r.isExisting).length;

  const displayedRows = parsedRows.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    try {
      setIsImporting(true);
      setImportProgress(null);

      const itemsPayload = validRows.map(r => ({
        name: r.name,
        category: r.category,
        price: r.price,
        stock: r.stock,
        unit: r.unit,
        description: r.description || null,
        price2kg: r.price2kg,
        discount2kg: r.discount2kg,
        price3kg: r.price3kg,
        discount3kg: r.discount3kg,
        imageUrl: r.imageUrl || null
      }));

      let res: BulkImportResponse;

      try {
        res = await bulkImportProducts(itemsPayload);
      } catch (bulkErr: any) {
        const errStr = String(bulkErr.message || '');
        const is404 = errStr.includes('404') || errStr.includes('Cannot POST');
        if (!is404) {
          throw bulkErr;
        }

        // Fallback automático: Si el backend en el servidor todavía no se reinició y da 404,
        // importamos fila por fila usando las rutas individuales estándar.
        let createdCount = 0;
        let updatedCount = 0;
        const errors: Array<{ row: number; name?: string; error: string }> = [];

        const catMap = new Map<string, number>();
        categories.forEach(c => catMap.set(c.name.trim().toLowerCase(), c.id));

        for (let i = 0; i < validRows.length; i++) {
          const r = validRows[i];
          setImportProgress(`Importando ${i + 1} de ${validRows.length}: ${r.name}...`);

          try {
            const catName = (r.category || 'General').trim();
            const lowerCat = catName.toLowerCase();
            let categoryId = catMap.get(lowerCat);

            if (!categoryId) {
              try {
                const newCat = await createCategory({ name: catName });
                categoryId = newCat.id;
                catMap.set(lowerCat, newCat.id);
              } catch {
                categoryId = categories[0]?.id || 1;
              }
            }

            const existing = existingProducts.find(
              p => p.name.trim().toLowerCase() === r.name.trim().toLowerCase()
            );

            const productPayload: any = {
              name: r.name,
              categoryId,
              price: r.price,
              stock: r.stock,
              unit: r.unit,
              description: r.description || null,
              imageUrl: r.imageUrl || null,
              price2kg: r.price2kg,
              discount2kg: r.discount2kg,
              price3kg: r.price3kg,
              discount3kg: r.discount3kg
            };

            if (existing) {
              await updateProduct(existing.id, productPayload);
              updatedCount++;
            } else {
              await createProduct(productPayload);
              createdCount++;
            }
          } catch (rowErr: any) {
            errors.push({ row: r.rowNumber, name: r.name, error: rowErr.message || 'Error al guardar producto' });
          }
        }

        res = {
          success: true,
          total: validRows.length,
          created: createdCount,
          updated: updatedCount,
          errors
        };
      }

      setImportResult(res);
      onSuccess();
    } catch (err: any) {
      alert('Error al importar productos: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                Carga Masiva con Excel / CSV
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Sube tu planilla de frutas y verduras con precios, stock y descuentos.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">

          {/* Resultado Exitoso */}
          {importResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-emerald-900">¡Importación Completada con Éxito!</h4>
                <p className="text-emerald-700 text-sm mt-1">
                  Tu catálogo ha sido actualizado en la base de datos.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                  <span className="block text-2xl font-black text-emerald-600">{importResult.created}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">Nuevos Creados</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                  <span className="block text-2xl font-black text-blue-600">{importResult.updated}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">Actualizados</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm col-span-2 sm:col-span-1">
                  <span className="block text-2xl font-black text-slate-700">{importResult.total}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">Total Procesados</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left p-3 rounded-xl max-w-md mx-auto space-y-1">
                  <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-600" /> Advertencias en filas:</span>
                  {importResult.errors.map((err, idx) => (
                    <div key={idx}>Fila {err.row}: {err.error}</div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Finalizar y Volver al Catálogo
                </button>
              </div>
            </div>
          )}

          {!importResult && (
            <>
              {/* Sección Descargar Plantilla y Guía */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-xs uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded-full mb-2">
                      <Info className="w-3.5 h-3.5" /> Paso 1: Usa la Plantilla Oficial
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-800">
                      Descarga el archivo Excel modelo listo para completar
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      Incluye las columnas exactas: <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-700 font-semibold">Nombre</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-700 font-semibold">Categoria</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-700 font-semibold">Precio</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-700 font-semibold">Stock</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-700 font-semibold">Precio_2kg</code>, <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-700 font-semibold">Precio_3kg</code>.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-emerald-700 font-bold px-4 py-2.5 rounded-xl border border-emerald-300 shadow-sm hover:shadow transition-all text-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Descargar Plantilla (.xlsx)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                  <span className="font-bold text-slate-800 block text-sm">💡 Reglas de importación:</span>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-700">Por Nombre:</strong> Si el producto ya existe, actualiza su precio y stock. Si no existe, lo crea.</li>
                    <li><strong className="text-slate-700">Stock = 0:</strong> El producto queda guardado pero se oculta automáticamente en la web.</li>
                    <li><strong className="text-slate-700">Categoría:</strong> Si escribes una categoría nueva, se creará sola.</li>
                  </ul>
                </div>
              </div>

              {/* Zona de Arrastrar y Soltar / Subida */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-700">
                        Arrastra y suelta tu archivo Excel aquí, o <span className="text-emerald-600 underline">haz clic para examinar</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Formatos soportados: Microsoft Excel (.xlsx, .xls) o CSV (.csv)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-800 block">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} filas detectadas
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Cambiar archivo
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg cursor-pointer"
                        title="Quitar archivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensajes de Carga o Error de Archivo */}
              {isParsing && (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>Analizando planilla Excel...</span>
                </div>
              )}

              {parseError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">No se pudo procesar el archivo</span>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Vista Previa de Filas */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">
                        Vista previa ({parsedRows.length} productos)
                      </span>
                    </div>

                    {/* Filtros de estado */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          filterStatus === 'all'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Todos ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('valid')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          filterStatus === 'valid'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        Listos ({parsedRows.filter(r => r.status === 'valid').length})
                      </button>
                      {warningRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterStatus('warning')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                            filterStatus === 'warning'
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          Avisos ({warningRows.length})
                        </button>
                      )}
                      {errorRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterStatus('error')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                            filterStatus === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          Errores ({errorRows.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badges de resumen rápido */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {newProductsCount} Nuevos
                    </span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> {updateProductsCount} Actualizaciones
                    </span>
                    {warningRows.length > 0 && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {warningRows.length} Stock en 0 (ocultos en web)
                      </span>
                    )}
                    {errorRows.length > 0 && (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errorRows.length} Con datos incompletos (se omitirán)
                      </span>
                    )}
                  </div>

                  {/* Tabla con Scroll horizontal y vertical */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Fila</th>
                          <th className="py-2.5 px-3">Acción</th>
                          <th className="py-2.5 px-3">Producto</th>
                          <th className="py-2.5 px-3">Categoría</th>
                          <th className="py-2.5 px-3">Precio</th>
                          <th className="py-2.5 px-3">Stock</th>
                          <th className="py-2.5 px-3">Promo 2kg</th>
                          <th className="py-2.5 px-3">Promo 3kg</th>
                          <th className="py-2.5 px-3">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {displayedRows.map((row) => (
                          <tr key={row.rowNumber} className={row.status === 'error' ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                            <td className="py-2 px-3 text-slate-400 font-mono">{row.rowNumber}</td>
                            <td className="py-2 px-3">
                              {row.status === 'error' ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              ) : row.isExisting ? (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                                  <RefreshCw className="w-3 h-3" /> Actualizar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> Nuevo
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800">{row.name || '(Sin nombre)'}</td>
                            <td className="py-2 px-3 text-slate-600">{row.category}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              ${row.price.toLocaleString('es-AR')} <span className="text-[10px] text-slate-400">/{row.unit}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`font-bold ${row.stock === 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                {row.stock} {row.unit}
                              </span>
                              {row.stock === 0 && (
                                <span className="block text-[10px] text-amber-500 font-normal">Oculto en web</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {row.price2kg ? `$${row.price2kg}` : '-'}
                              {row.discount2kg ? ` (${row.discount2kg}%)` : ''}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {row.price3kg ? `$${row.price3kg}` : '-'}
                              {row.discount3kg ? ` (${row.discount3kg}%)` : ''}
                            </td>
                            <td className="py-2 px-3 text-[11px] text-slate-500">
                              {row.statusMessage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer con Acciones */}
        {!importResult && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validRows.length === 0 || isImporting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                validRows.length > 0 && !isImporting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{importProgress || 'Importando a la base de datos...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Importar {validRows.length} Productos Válidos</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
