/**
 * reservas.js — Lógica del módulo de reservas de mesa (La Finestra).
 *
 * Responsabilidades:
 *   - Manejo de chips de hora y personas.
 *   - Validación defensiva de campos obligatorios y longitudes.
 *   - Envío asíncrono a Supabase public.reservas (con 'Prefer: return=minimal' por RLS).
 *   - Apertura de WhatsApp con el mensaje estructurado usando config.js.
 */

import { WA_NUMBER, SUPABASE_URL, SUPABASE_ANON } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización defensiva de fecha mínima (Zona Horaria America/Caracas UTC-4)
  // Sincronizado con la política RLS: fecha >= (NOW() AT TIME ZONE 'America/Caracas')::DATE
  const fechaInput = document.getElementById('res-fecha');
  if (fechaInput) {
    try {
      const hoyVzla = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
      fechaInput.min = hoyVzla;
      if (!fechaInput.value) fechaInput.value = hoyVzla;
    } catch (e) {
      const hoyIso = new Date().toISOString().split('T')[0];
      fechaInput.min = hoyIso;
      if (!fechaInput.value) fechaInput.value = hoyIso;
    }
  }

  // Selección de chip de hora
  document.querySelectorAll('#res-hora-chips .rf-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('#res-hora-chips .rf-chip').forEach(c => c.classList.remove('activo'));
      this.classList.add('activo');
    });
  });

  // Selección de chip de personas
  document.querySelectorAll('#res-personas-chips .rf-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('#res-personas-chips .rf-chip').forEach(c => c.classList.remove('activo'));
      this.classList.add('activo');
    });
  });

  // Envío de reserva por WhatsApp y persistencia en Supabase
  const submitBtn = document.getElementById('rf-submit');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    if (submitBtn.disabled) return;

    const nombre   = document.getElementById('res-nombre')?.value.trim() || '';
    const telefono = document.getElementById('res-telefono')?.value.trim() || '';
    const fecha    = document.getElementById('res-fecha')?.value || '';
    const horaEl   = document.querySelector('#res-hora-chips .rf-chip.activo');
    const persEl   = document.querySelector('#res-personas-chips .rf-chip.activo');
    const notas    = document.getElementById('res-notas')?.value.trim() || '';
    const errorEl  = document.getElementById('rf-error');

    const showError = (msg) => {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!nombre || !fecha || !horaEl || !persEl) {
      showError('Por favor completa todos los campos obligatorios.');
      return;
    }

    // Validación estricta 1:1 con constraint SQL chk_reservas_longitudes
    if (nombre.length < 2 || nombre.length > 120) {
      showError('El nombre debe contener entre 2 y 120 caracteres.');
      return;
    }

    if (telefono.length > 30) {
      showError('El número de teléfono no puede exceder 30 caracteres.');
      return;
    }

    if (notas.length > 500) {
      showError('Las notas adicionales no pueden exceder 500 caracteres.');
      return;
    }

    if (errorEl) errorEl.classList.remove('visible');

    const horaVal = horaEl.dataset.val;
    const persVal = persEl.dataset.val;

    // Bloqueo temporal anti-doble clic (evita reservas duplicadas)
    submitBtn.disabled = true;
    setTimeout(() => { submitBtn.disabled = false; }, 3000);

    // 1. Persistencia defensiva en Supabase con keepalive: true
    // Garantiza que el navegador móvil no aborte el POST al cambiar a la app de WhatsApp
    if (SUPABASE_URL && SUPABASE_ANON) {
      try {
        fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/reservas`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'apikey':        SUPABASE_ANON,
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal'
          },
          body: JSON.stringify({
            nombre,
            telefono: telefono || null,
            fecha,
            hora: String(horaVal).slice(0, 20),
            personas: String(persVal).slice(0, 20),
            notas: notas || null,
            estado: 'pendiente'
          })
        }).catch(err => {
          console.warn('[reservas] Persistencia en nube no disponible:', err.message);
        });
      } catch (err) {
        // Degrada silenciosamente al canal WhatsApp
      }
    }

    // 2. Formateo y Apertura del canal WhatsApp
    const [y, m, d] = fecha.split('-');
    const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fo = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const fechaLegible = `${dias[fo.getDay()]} ${d} de ${meses[parseInt(m, 10) - 1]} de ${y}`;

    const lines = [
      '📅 *Reserva en La Finestra*',
      '',
      `👤 *Nombre:* ${nombre}`,
    ];

    if (telefono) {
      lines.push(`📱 *Teléfono:* ${telefono}`);
    }

    lines.push(`📆 *Fecha:* ${fechaLegible}`);
    lines.push(`🕐 *Hora:* ${horaVal}`);
    lines.push(`👥 *Personas:* ${persVal}`);

    if (notas) {
      lines.push(`📝 *Notas:* ${notas}`);
    }

    lines.push('');
    lines.push('_Enviado desde el portal oficial de La Finestra_');

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank');
  });
});
