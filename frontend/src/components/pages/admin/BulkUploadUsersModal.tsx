import { useState } from 'react';
import axios from 'axios';
import { X, Upload, Download, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import {
    usersBulkUploadService,
    type BulkPreviewResponse,
    type BulkConfirmResponse,
} from '../../../services/usersBulkUploadService';

interface UserType {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    subdireccion_id: string;
}

interface Subdireccion {
    id: string;
    name: string;
}

interface BulkUploadUsersModalProps {
    userTypes: UserType[];
    areas: Area[];
    subdirecciones: Subdireccion[];
    onClose: () => void;
    onCompleted: () => void;
}

type Step = 'form' | 'preview' | 'result';

export default function BulkUploadUsersModal({ userTypes, areas, subdirecciones, onClose, onCompleted }: BulkUploadUsersModalProps) {
    const [step, setStep] = useState<Step>('form');
    const [subdireccionId, setSubdireccionId] = useState('');
    const [areaId, setAreaId] = useState('');
    const [userTypeId, setUserTypeId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<BulkPreviewResponse | null>(null);
    const [result, setResult] = useState<BulkConfirmResponse | null>(null);

    const selectedUserType = userTypes.find(t => t.id === userTypeId);
    const isSubdirector = selectedUserType?.name === 'admin_subdireccion';
    const filteredAreas = subdireccionId ? areas.filter(a => a.subdireccion_id === subdireccionId) : [];

    const handleDownloadTemplate = async () => {
        try {
            await usersBulkUploadService.downloadTemplate();
        } catch {
            setError('No se pudo descargar la plantilla.');
        }
    };

    const handlePreview = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('Debe seleccionar un archivo Excel.');
            return;
        }

        setLoading(true);
        try {
            const data = await usersBulkUploadService.preview(file, {
                subdireccion_id: subdireccionId,
                area_id: isSubdirector ? undefined : areaId,
                user_type_id: userTypeId,
            });
            setPreview(data);
            setStep('preview');
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(message) ? message.join(', ') : (message || 'Error al procesar el archivo.'));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!preview) return;
        setLoading(true);
        setError('');
        try {
            const validRows = preview.rows.filter(r => r.status === 'ok');
            const data = await usersBulkUploadService.confirm(
                {
                    subdireccion_id: subdireccionId,
                    area_id: isSubdirector ? undefined : areaId,
                    user_type_id: userTypeId,
                },
                validRows.map(r => ({
                    names: r.names,
                    last_name: r.last_name,
                    num_id: r.num_id,
                    email: r.email,
                    charge: r.charge,
                    username: r.username,
                    password: r.password,
                })),
            );
            setResult(data);
            setStep('result');
            onCompleted();
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(message) ? message.join(', ') : (message || 'Error al crear los usuarios.'));
        } finally {
            setLoading(false);
        }
    };

    const validCount = preview?.rows.filter(r => r.status === 'ok').length ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <Upload className="text-primary" size={22} />
                        Cargar usuarios desde Excel
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'form' && (
                        <form id="bulkUploadForm" onSubmit={handlePreview} className="space-y-4">
                            <p className="text-sm text-zinc-500">
                                Selecciona la subdirección, área y tipo de usuario que se asignará a todos los usuarios del archivo.
                                Los datos personales (nombres, apellidos, identificación, email, cargo) se toman del Excel.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Subdirección</label>
                                    <select
                                        required
                                        value={subdireccionId}
                                        onChange={(e) => { setSubdireccionId(e.target.value); setAreaId(''); }}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                    >
                                        <option value="">Seleccione subdirección...</option>
                                        {subdirecciones.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Tipo de usuario</label>
                                    <select
                                        required
                                        value={userTypeId}
                                        onChange={(e) => { setUserTypeId(e.target.value); setAreaId(''); }}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                    >
                                        <option value="">Seleccione tipo de usuario...</option>
                                        {userTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {!isSubdirector && (
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Área</label>
                                        <select
                                            required
                                            disabled={!subdireccionId}
                                            value={areaId}
                                            onChange={(e) => setAreaId(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                                        >
                                            <option value="">{subdireccionId ? 'Seleccione área...' : 'Seleccione primero una subdirección'}</option>
                                            {filteredAreas.map(area => (
                                                <option key={area.id} value={area.id}>{area.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-zinc-200 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-zinc-700">Archivo Excel</label>
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                                    >
                                        <Download size={16} />
                                        Descargar plantilla
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    required
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-semibold"
                                />
                                <p className="text-xs text-zinc-400 mt-1">
                                    Columnas esperadas: Nombres, Apellidos, Identificación, Email, Cargo (opcional).
                                </p>
                            </div>
                        </form>
                    )}

                    {step === 'preview' && preview && (
                        <div>
                            <div className="flex gap-4 mb-4">
                                <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 flex-1 text-center">
                                    <div className="text-2xl font-black text-zinc-900">{preview.total}</div>
                                    <div className="text-xs text-zinc-500 uppercase font-semibold">Filas leídas</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex-1 text-center">
                                    <div className="text-2xl font-black text-green-700">{preview.valid}</div>
                                    <div className="text-xs text-green-600 uppercase font-semibold">Listas para crear</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1 text-center">
                                    <div className="text-2xl font-black text-red-700">{preview.invalid}</div>
                                    <div className="text-xs text-red-600 uppercase font-semibold">Con errores</div>
                                </div>
                            </div>

                            <div className="border border-zinc-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Fila</th>
                                                <th className="px-4 py-3">Nombres</th>
                                                <th className="px-4 py-3">Apellidos</th>
                                                <th className="px-4 py-3">Identificación</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Usuario</th>
                                                <th className="px-4 py-3">Contraseña</th>
                                                <th className="px-4 py-3">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200">
                                            {preview.rows.map((row) => (
                                                <tr key={row.row} className={row.status === 'error' ? 'bg-red-50/50' : ''}>
                                                    <td className="px-4 py-2 text-zinc-500">{row.row}</td>
                                                    <td className="px-4 py-2">{row.names}</td>
                                                    <td className="px-4 py-2">{row.last_name}</td>
                                                    <td className="px-4 py-2">{row.num_id}</td>
                                                    <td className="px-4 py-2">{row.email}</td>
                                                    <td className="px-4 py-2 font-mono text-xs">{row.username || '—'}</td>
                                                    <td className="px-4 py-2 font-mono text-xs">{row.password || '—'}</td>
                                                    <td className="px-4 py-2">
                                                        {row.status === 'ok' ? (
                                                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                                                                <CheckCircle size={12} /> OK
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium"
                                                                title={row.errors.join(', ')}
                                                            >
                                                                <XCircle size={12} /> {row.errors.join(', ')}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && result && (
                        <div>
                            <div className="flex gap-4 mb-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex-1 text-center">
                                    <div className="text-2xl font-black text-green-700">{result.created}</div>
                                    <div className="text-xs text-green-600 uppercase font-semibold">Usuarios creados</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1 text-center">
                                    <div className="text-2xl font-black text-red-700">{result.failed}</div>
                                    <div className="text-xs text-red-600 uppercase font-semibold">Con error</div>
                                </div>
                            </div>

                            <div className="border border-zinc-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Nombres</th>
                                                <th className="px-4 py-3">Usuario</th>
                                                <th className="px-4 py-3">Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200">
                                            {result.results.map((r, i) => (
                                                <tr key={i} className={r.status === 'error' ? 'bg-red-50/50' : ''}>
                                                    <td className="px-4 py-2">{r.names} {r.last_name}</td>
                                                    <td className="px-4 py-2 font-mono text-xs">{r.username}</td>
                                                    <td className="px-4 py-2">
                                                        {r.status === 'created' ? (
                                                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                                                                <CheckCircle size={12} /> Creado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                                                                <XCircle size={12} /> {r.message}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-zinc-200 shrink-0 flex gap-3 bg-zinc-50">
                    {step === 'form' && (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="bulkUploadForm"
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={18} />}
                                Previsualizar
                            </button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Volver
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={loading || validCount === 0}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={18} />}
                                Confirmar y crear {validCount} usuario{validCount === 1 ? '' : 's'}
                            </button>
                        </>
                    )}

                    {step === 'result' && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
