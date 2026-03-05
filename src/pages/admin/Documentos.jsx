import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config/api';
import BotonMenu from '../../components/ui/BotonMenu';
import { obtenerTodasLasCotizaciones, eliminarCotizacionSimple, eliminarOrdenTrabajo, eliminarReporteTrabajo, subirPDFCotizacion } from '../../utils/documentStorage';
import { formatearFecha } from '../../utils/documentConverter';
import { generarPDFCotizacion } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

function Documentos() {
    const navigate = useNavigate();
    const [documentos, setDocumentos] = useState([]);
    const [vistaActual, setVistaActual] = useState('menu'); // 'menu' o 'historial'
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [editandoNumero, setEditandoNumero] = useState(null);
    const [nuevoNumero, setNuevoNumero] = useState('');

    // Detectar tipo de documento basado en el número
    const detectarTipoDocumento = (numero) => {
        if (!numero) return { tipo: 'Desconocido', icono: '📄', color: 'gray' };
        
        const numeroUpper = numero.toUpperCase();
        
        if (numeroUpper.startsWith('COT-')) {
            return { tipo: 'Cotización', icono: '📄', color: 'blue' };
        } else if (numeroUpper.startsWith('OT-')) {
            return { tipo: 'Orden de Trabajo', icono: '🔧', color: 'green' };
        } else if (numeroUpper.startsWith('RT-')) {
            return { tipo: 'Reporte de Trabajo', icono: '📋', color: 'purple' };
        } else {
            return { tipo: 'Documento', icono: '📄', color: 'gray' };
        }
    };

    useEffect(() => {
        if (vistaActual === 'historial') {
            cargarHistorial();
        }
    }, [vistaActual]);

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            const data = await obtenerTodasLasCotizaciones();
            setDocumentos(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar historial');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargar = (doc) => {
        if (doc.pdfUrl) {
            window.open(`${API_URL}/${doc.pdfUrl}`, '_blank');
        } else {
            toast.error('PDF no disponible');
        }
    };

    const handleEliminar = async (doc) => {
        const tipoDocumento = detectarTipoDocumento(doc.numero).tipo;
        if (window.confirm(`¿Seguro que deseas eliminar el ${tipoDocumento} ${doc.numero}?`)) {
            try {
                if (doc.numero.startsWith('COT-')) {
                    await eliminarCotizacionSimple(doc.numero);
                } else if (doc.numero.startsWith('OT-')) {
                    await eliminarOrdenTrabajo(doc.numero);
                } else if (doc.numero.startsWith('RT-')) {
                    await eliminarReporteTrabajo(doc.numero);
                }
                toast.success('Eliminado correctamente');
                cargarHistorial();
            } catch (error) {
                toast.error('Error al eliminar');
            }
        }
    };

    const handleEditar = (doc) => {
        navigate('/admin/crear-cotizaciones', { state: { cotizacion: doc } });
    };

    const handleEditarNumero = (doc) => {
        setEditandoNumero(doc.numero);
        setNuevoNumero(doc.numero);
    };

    const handleGuardarNumero = async (doc) => {
        if (!nuevoNumero.trim()) {
            toast.error('El número no puede estar vacío');
            return;
        }

        const toastId = toast.loading('Actualizando número y regenerando PDF...');

        try {
            let nuevaPdfUrl = doc.pdfUrl;

            // Intentar regenerar el PDF con el nuevo número si existen datos
            if (doc.datos && doc.productos && Array.isArray(doc.productos)) {
                try {
                    // Extraer los datos necesarios para el generador
                    // doc.datos usualmente tiene todo, asegurémonos
                    const formData = {
                        fecha: doc.fecha,
                        validez: doc.datos.validez || '30',
                        titulo: doc.titulo,
                        moneda: doc.datos.moneda || 'MXN',
                        descuento: doc.datos.descuento || '0',
                        impuesto: doc.datos.impuesto || '16',
                        descripcion: doc.datos.descripcion || '',
                        notas: doc.datos.notas || '',
                        terminosCondiciones: doc.tos || doc.datos.terminosCondiciones || '',
                        clienteNombre: doc.cliente?.nombre || doc.clienteNombre || '',
                        clienteEmpresa: doc.cliente?.empresa || doc.clienteEmpresa || '',
                        clienteEmail: doc.cliente?.email || doc.clienteEmail || '',
                        clienteTelefono: doc.cliente?.telefono || doc.clienteTelefono || '',
                        clienteDireccion: doc.cliente?.direccion || doc.clienteDireccion || '',
                        creadoPor: doc.datos.creadoPor || 'Admin'
                    };

                    const items = doc.productos; // Asumiendo que products está en la raíz del objeto doc
                    
                    const pdfFile = await generarPDFCotizacion(formData, items, nuevoNumero.trim());
                    const uploadRes = await subirPDFCotizacion(pdfFile);
                    nuevaPdfUrl = uploadRes.url;
                    
                } catch (pdfError) {
                    console.error('Error regenerando PDF:', pdfError);
                    toast.error('No se pudo regenerar el PDF, se mantendrá el antiguo', { id: toastId });
                    // Continuamos para guardar el número al menos
                }
            }

            // Usamos la misma estructura robusta que en CrearCotizaciones
            const datosActualizados = {
                ...doc,
                numero: nuevoNumero.trim(),
                pdfUrl: nuevaPdfUrl, // Nueva URL regenerada
                oldNumero: doc.numero,
                oldPdfUrl: doc.pdfUrl // Enviamos URL vieja para que backend borre
            };

            await guardarCotizacionSimple(datosActualizados, true);

            toast.dismiss(toastId);
            toast.success('Número actualizado y PDF regenerado');
            setEditandoNumero(null);
            cargarHistorial();
        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error('Error al actualizar');
        }
    };

    const filteredDocs = documentos.filter(doc =>
        doc.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        (doc.servicioCliente && doc.servicioCliente.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // VISTA MENÚ
    if (vistaActual === 'menu') {
        return (
            <div className="w-full h-full animate-fadeInUp flex flex-col min-h-0">
                <div className="mb-6 shrink-0">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-500">Gestión de Documentos</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Crear y administrar documentos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full grow">
                    <BotonMenu
                        gradient="from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90"
                        icon="💰"
                        titulo="Cotizaciones"
                        badgeText="Generar"
                        onClick={() => navigate('/admin/crear-cotizaciones')}
                    />
                    <BotonMenu
                        gradient="from-purple-500/80 to-purple-600/80 hover:from-purple-600/90 hover:to-purple-700/90"
                        icon="📋"
                        titulo="Orden de Trabajo"
                        badgeText="Nueva"
                        onClick={() => navigate('/admin/crear-orden-trabajo')}
                    />
                    <BotonMenu
                        gradient="from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90"
                        icon="📊"
                        titulo="Reporte de Trabajo"
                        badgeText="Generar"
                        onClick={() => navigate('/admin/crear-reporte-trabajo')}
                    />
                    <BotonMenu
                        gradient="from-orange-500/80 to-orange-600/80 hover:from-orange-600/90 hover:to-orange-700/90"
                        icon="📁"
                        titulo="Archivo de Documentos"
                        badgeText="Consultar"
                        onClick={() => setVistaActual('historial')}
                    />
                </div>
            </div>
        );
    }

    // VISTA HISTORIAL
    return (
        <div className="max-w-7xl mx-auto animate-fadeInUp pb-12 w-full h-full flex flex-col overflow-hidden">
            <div className="shrink-0 mb-6">
                <button
                    onClick={() => setVistaActual('menu')}
                    className="text-gray-600 hover:text-gray-700 font-bold flex items-center gap-2 mb-4"
                >
                    ← Volver
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Archivo de Documentos</h1>

                {/* Buscador */}
                <div className="mt-4 relative max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por número o cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-xl border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
                {loading ? (
                    <div className="p-20 text-center text-gray-400">Cargando...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Número</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                        No se encontraron documentos
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={`${doc.servicioId}-${doc.numero}`} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 align-middle">
                                            {editandoNumero === doc.numero ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={nuevoNumero}
                                                        onChange={(e) => setNuevoNumero(e.target.value)}
                                                        className="font-mono text-sm font-semibold text-blue-600 bg-white px-3 py-2 rounded-lg border-2 border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none w-36"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleGuardarNumero(doc)} className="text-green-600 hover:text-green-700 text-xl font-bold p-1">✓</button>
                                                    <button onClick={() => setEditandoNumero(null)} className="text-red-500 hover:text-red-600 text-xl p-1">✕</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group/numero">
                                                    <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">
                                                        {doc.numero}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleEditarNumero(doc)} 
                                                        className="opacity-0 group-hover/numero:opacity-100 text-blue-500 hover:text-blue-700 transition-all text-xs p-1"
                                                        title="Editar número"
                                                    >
                                                        ✏️
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            {(() => {
                                                const tipoInfo = detectarTipoDocumento(doc.numero);
                                                const colorClasses = {
                                                    blue: 'bg-blue-100 text-blue-700 border-blue-200',
                                                    green: 'bg-green-100 text-green-700 border-green-200',
                                                    purple: 'bg-purple-100 text-purple-700 border-purple-200',
                                                    gray: 'bg-gray-100 text-gray-700 border-gray-200'
                                                };
                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${colorClasses[tipoInfo.color]}`}>
                                                        <span>{tipoInfo.icono}</span>
                                                        <span>{tipoInfo.tipo}</span>
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className="text-sm text-gray-600 font-medium">{formatearFecha(doc.fecha)}</span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className="text-sm font-semibold text-gray-800">
                                                {doc.cliente?.nombre || doc.servicioCliente}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDescargar(doc)} 
                                                    className={`flex items-center justify-center gap-1.5 font-semibold px-3 py-2 rounded-lg transition-all duration-150 text-xs min-w-[90px] ${
                                                        doc.pdfUrl 
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md cursor-pointer'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    title={doc.pdfUrl ? "Ver PDF" : "PDF no disponible"}
                                                    disabled={!doc.pdfUrl}
                                                >
                                                    <span>📄</span>
                                                    <span>Ver PDF</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleEditar(doc)} 
                                                    className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 text-xs min-w-[80px]"
                                                    title="Editar"
                                                >
                                                    <span>✏️</span>
                                                    <span>Editar</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleEliminar(doc)} 
                                                    className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 text-xs min-w-[80px]"
                                                    title="Eliminar"
                                                >
                                                    <span>🗑️</span>
                                                    <span>Eliminar</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Documentos;
