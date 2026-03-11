
import React from 'react';
import { X, BookOpen, Info, HelpCircle, AlertCircle, CheckCircle2, FileText, BarChart, Download, Lightbulb, Hash, AlertTriangle } from 'lucide-react';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manual de Uso e Interpretación</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">ResiduoCheck</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* Introducción */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              <Info size={20} className="text-cyan-600" />
              1. Introducción
            </h3>
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Esta aplicación está diseñada para evaluar el cumplimiento de límites de contaminantes en alimentos utilizando métodos estadísticos avanzados. Permite determinar si un conjunto de muestras cumple con los límites regulatorios establecidos.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Público Objetivo</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2">• Inspectores de calidad alimentaria</li>
                  <li className="flex items-center gap-2">• Laboratorios de análisis de alimentos</li>
                  <li className="flex items-center gap-2">• Gerentes de control de calidad</li>
                  <li className="flex items-center gap-2">• Investigadores en seguridad alimentaria</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Configuración */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              <FileText size={20} className="text-cyan-600" />
              2. Configuración del Análisis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Información de Muestreo</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li><b className="text-slate-800 dark:text-slate-200">Contaminante:</b> Nombre del analito (ej: Plomo, Mercurio).</li>
                  <li><b className="text-slate-800 dark:text-slate-200">Alimento:</b> Tipo de producto muestreado.</li>
                  <li><b className="text-slate-800 dark:text-slate-200">Lugar/Región:</b> Origen geográfico de las muestras.</li>
                  <li><b className="text-slate-800 dark:text-slate-200">Unidades:</b> mg/kg, µg/kg, ppm o ppb.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Datos de Concentración</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ingrese los valores separados por comas, espacios o saltos de línea. Se requiere un <b className="text-cyan-600">mínimo de 3 muestras</b>, aunque se recomiendan más de 10 para mayor precisión.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg font-mono text-xs text-slate-500">
                  0.04, 0.06, 0.03, 0.05...
                </div>
              </div>
            </div>
          </section>

          {/* Interpretación */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              <AlertCircle size={20} className="text-cyan-600" />
              3. Interpretación de Resultados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-2">
                  <CheckCircle2 size={18} /> Bajo Riesgo
                </div>
                <p className="text-xs text-green-600 dark:text-green-500/80 leading-relaxed">
                  Cumplimiento ≥ 95%. El lote cumple satisfactoriamente con los límites establecidos.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-bold mb-2">
                  <AlertCircle size={18} /> Riesgo Medio
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-500/80 leading-relaxed">
                  Cumplimiento 90% - 95%. El lote requiere atención y revisión adicional recomendada.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-2">
                  <AlertCircle size={18} /> Alto Riesgo
                </div>
                <p className="text-xs text-red-600 dark:text-red-500/80 leading-relaxed">
                  Cumplimiento &lt; 90%. El lote no cumple. Se deben tomar acciones correctivas inmediatas.
                </p>
              </div>
            </div>
          </section>

          {/* Métodos de Evaluación */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              <BarChart size={20} className="text-cyan-600" />
              4. Métodos de Evaluación
            </h3>
            <div className="space-y-6 text-sm">
              <div className="flex gap-4">
                <div className="w-1 bg-cyan-500 rounded-full shrink-0"></div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Método Empírico (Fn(X))</h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Proporción directa de muestras que están por debajo del límite X. Es simple y no asume ninguna distribución específica.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 bg-indigo-500 rounded-full shrink-0"></div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Modelo Normal</h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Asume que los datos siguen una campana de Gauss. Recomendado cuando las pruebas de normalidad (Anderson-Darling o Shapiro-Wilk) son positivas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 bg-purple-500 rounded-full shrink-0"></div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Modelo Log-normal</h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Adecuado para datos de contaminantes que suelen presentar sesgo positivo (muchos valores bajos y pocos muy altos).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Visualizaciones Clave */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              <Lightbulb size={20} className="text-cyan-600" />
              5. Visualizaciones Clave
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                <h4 className="font-bold mb-2">Histograma y Curva Normal</h4>
                <p className="text-slate-600 dark:text-slate-400">Permite comparar visualmente la distribución real de sus datos frente a la teoría. La línea roja discontinua marca su Límite X.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl">
                <h4 className="font-bold mb-2">Gráfico Q-Q</h4>
                <p className="text-slate-600 dark:text-slate-400">Si los puntos se alinean con la diagonal, los datos son normales. Desviaciones en las colas indican valores atípicos o distribuciones diferentes.</p>
              </div>
            </div>
          </section>

          {/* Glosario y Limitaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                <Hash size={20} className="text-cyan-600" />
                6. Glosario Técnico
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li><b className="text-slate-800 dark:text-slate-200">Media:</b> Valor promedio de las muestras.</li>
                <li><b className="text-slate-800 dark:text-slate-200">Mediana:</b> Valor central del conjunto ordenado.</li>
                <li><b className="text-slate-800 dark:text-slate-200">Desviación Estándar:</b> Medida de dispersión de los datos.</li>
                <li><b className="text-slate-800 dark:text-slate-200">Valor Z:</b> Distancia de X a la media en unidades de desviación estándar.</li>
                <li><b className="text-slate-800 dark:text-slate-200">Percentil:</b> Valor por debajo del cual cae un porcentaje de los datos.</li>
              </ul>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                <AlertTriangle size={20} className="text-cyan-600" />
                7. Limitaciones
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                  <span><b className="text-slate-800 dark:text-slate-200">Tamaño muestral:</b> Mínimo 3 muestras, ideal &gt; 20 para robustez.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                  <span><b className="text-slate-800 dark:text-slate-200">Distribución:</b> Los modelos paramétricos dependen del supuesto de normalidad.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                  <span><b className="text-slate-800 dark:text-slate-200">Valores extremos:</b> Pueden sesgar significativamente los resultados.</span>
                </li>
              </ul>
            </section>
          </div>

          {/* FAQ */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              <HelpCircle size={20} className="text-cyan-600" />
              8. Preguntas Frecuentes
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">¿Qué método debo usar?</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Si las pruebas de normalidad son positivas (p &gt; 0.05), use el Modelo Normal. De lo contrario, prefiera el Método Empírico o Log-normal.</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">¿Qué significa un Valor Z negativo?</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Indica que el Límite X está por debajo de la media de sus muestras, lo cual es una situación favorable para el cumplimiento.</p>
              </div>
            </div>
          </section>

          {/* Footer del manual */}
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Para soporte técnico o consultas adicionales, revise la consola del navegador (F12) o contacte al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManual;
