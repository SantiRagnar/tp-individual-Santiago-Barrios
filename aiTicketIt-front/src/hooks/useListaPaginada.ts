import { useCallback, useEffect, useRef, useState } from 'react';

import { ErrorApi } from '@/api/cliente';

export type Pagina<T> = { items: T[]; total: number; siguiente: string | null };

type Estado<T> = {
  /** Criterio al que corresponden estos datos; si no es el actual, la lista está cargando. */
  clave: string | null;
  items: T[];
  total: number;
  siguiente: string | null;
  error: 'inicial' | 'siguiente' | null;
  cargandoMas: boolean;
};

const VACIO = { clave: null, items: [], total: 0, siguiente: null, error: null, cargandoMas: false };

/** Agrega sin repetir ids (si un elemento cambió de lugar entre dos páginas, research R4). */
function agregarSinRepetir<T extends { id: string }>(actuales: T[], nuevos: T[]) {
  const vistos = new Set(actuales.map((item) => item.id));
  return [...actuales, ...nuevos.filter((item) => !vistos.has(item.id))];
}

const esCancelado = (error: unknown) => error instanceof ErrorApi && error.codigo === 'CANCELADO';

/**
 * Lista paginada por cursor (research R12 de la feature 003). `clave` identifica el criterio
 * (búsqueda, chip, orden): al cambiar, cancela el pedido anterior y vuelve a la primera página.
 * Las respuestas de un criterio viejo se descartan.
 */
export function useListaPaginada<T extends { id: string }>(
  pedirPagina: (cursor: string | null, signal: AbortSignal) => Promise<Pagina<T>>,
  clave: string,
) {
  const [estado, setEstado] = useState<Estado<T>>(VACIO);
  const [intento, setIntento] = useState(0);
  const pedir = useRef(pedirPagina);
  const pedidoActual = useRef(0);
  const controlSiguiente = useRef<AbortController | null>(null);

  useEffect(() => {
    pedir.current = pedirPagina;
  }, [pedirPagina]);

  useEffect(() => {
    const control = new AbortController();
    const pedido = ++pedidoActual.current;
    controlSiguiente.current?.abort();
    pedir.current(null, control.signal).then(
      (pagina) => {
        if (pedido !== pedidoActual.current) return;
        setEstado({ clave, items: agregarSinRepetir([], pagina.items), total: pagina.total, siguiente: pagina.siguiente, error: null, cargandoMas: false });
      },
      (error) => {
        if (esCancelado(error) || pedido !== pedidoActual.current) return;
        setEstado({ ...VACIO, clave, error: 'inicial' });
      },
    );
    return () => control.abort();
  }, [clave, intento]);

  const vigente = estado.clave === clave;

  const cargarMas = useCallback(() => {
    if (!vigente || estado.cargandoMas || estado.error === 'inicial' || !estado.siguiente) return;
    const pedido = pedidoActual.current;
    const control = new AbortController();
    controlSiguiente.current = control;
    setEstado((e) => ({ ...e, cargandoMas: true, error: null }));
    pedir.current(estado.siguiente, control.signal).then(
      (pagina) => {
        if (pedido !== pedidoActual.current) return;
        setEstado((e) => ({
          ...e,
          items: agregarSinRepetir(e.items, pagina.items),
          total: pagina.total,
          siguiente: pagina.siguiente,
          cargandoMas: false,
        }));
      },
      (error) => {
        if (esCancelado(error) || pedido !== pedidoActual.current) return;
        setEstado((e) => ({ ...e, cargandoMas: false, error: 'siguiente' }));
      },
    );
  }, [vigente, estado.cargandoMas, estado.error, estado.siguiente]);

  /** Reintenta lo que falló: la primera página o la siguiente. */
  const reintentar = useCallback(() => {
    if (estado.error === 'siguiente') {
      cargarMas();
      return;
    }
    setEstado(VACIO);
    setIntento((i) => i + 1);
  }, [estado.error, cargarMas]);

  return {
    items: vigente ? estado.items : [],
    total: vigente ? estado.total : 0,
    cargando: !vigente,
    cargandoMas: vigente && estado.cargandoMas,
    hayMas: vigente && estado.siguiente !== null,
    error: vigente ? estado.error : null,
    cargarMas,
    reintentar,
    /** Reemplaza un elemento ya cargado (p. ej. al cambiar su favorito). */
    actualizar: (id: string, cambio: (item: T) => T) =>
      setEstado((e) => ({ ...e, items: e.items.map((item) => (item.id === id ? cambio(item) : item)) })),
  };
}
