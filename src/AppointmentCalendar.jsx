import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

function formatDateTime(date, time) {
  if (!date || !time) return "";
  return `${date} ${time}`;
}

function generateDefaultSlots() {
  const slots = [];
  const start = 9;
  const end = 17; // 17:00 no se permite, último es 16:30

  for (let hour = start; hour < end; hour++) {
    slots.push(`${String(hour).padStart(2, "0")} :00`.replace(" ", ""));
    slots.push(`${String(hour).padStart(2, "0")} :30`.replace(" ", ""));
  }

  return slots;
}

function AppointmentCalendar() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [citas, setCitas] = useState([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState(generateDefaultSlots());
  const [notificationStatus, setNotificationStatus] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const isWeekend = (dateString) => {
    const d = new Date(dateString + "T00:00");
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  useEffect(() => {
    const stored = localStorage.getItem("citas-agendadas");
    if (stored) {
      try {
        setCitas(JSON.parse(stored));
      } catch (error) {
        console.warn("No se pudo cargar las citas guardadas", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("citas-agendadas", JSON.stringify(citas));

    if (!fecha) {
      setSlotsDisponibles(generateDefaultSlots());
      return;
    }

    const ocupados = citas
      .filter((cita) => cita.fecha === fecha)
      .map((cita) => cita.hora);

    const base = generateDefaultSlots();
    const libres = base.filter((slot) => !ocupados.includes(slot));
    setSlotsDisponibles(libres);

    if (hora && ocupados.includes(hora)) {
      setHora("");
    }
  }, [citas, fecha, hora]);

  const sendEmailNotification = async (cita) => {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn("Configura variables de entorno de EmailJS");
      return;
    }

    const templateParams = {
      to_name: "Equipo Orgonitas",
      user_name: cita.nombre,
      appointment_date: cita.fecha,
      appointment_time: cita.hora,
      notes: cita.notas || "Sin notas",
    };

    try {
      setNotificationStatus("enviando");
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      setNotificationStatus("enviado");
    } catch (error) {
      console.error("Error enviando notificación de cita:", error);
      setNotificationStatus("error");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nombre.trim() || !fecha || !hora) {
      alert("Completa nombre, fecha y hora para agendar la cita.");
      return;
    }

    const nuevaCita = {
      id: Date.now(),
      nombre: nombre.trim(),
      fecha,
      hora,
      notas: notas.trim(),
      creado: new Date().toISOString(),
    };

    setCitas((prev) => [...prev, nuevaCita]);
    setNombre("");
    setFecha("");
    setHora("");
    setNotas("");

    await sendEmailNotification(nuevaCita);
  };

  const borrarCita = (id) => {
    setCitas((prev) => prev.filter((cita) => cita.id !== id));
  };

  return (
    <section id="appointment-calendar">
      <h2>Agenda tu cita</h2>
      <p>Selecciona fecha y hora para que nuestro equipo te contacte.</p>

      <form className="calendar-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div>
          <label htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            min={today}
            onChange={(e) => {
              const selected = e.target.value;
              if (isWeekend(selected)) {
                alert("Los fines de semana no están disponibles, elige un día entre lunes y viernes.");
                setFecha("");
                return;
              }
              setFecha(selected);
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="hora">Hora</label>
          <select
            id="hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
            disabled={!fecha}
          >
            <option value="">Selecciona una hora</option>
            {slotsDisponibles.length === 0 ? (
              <option value="" disabled>
                No hay horarios disponibles
              </option>
            ) : (
              slotsDisponibles.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="notas">Notas (opcional)</label>
          <textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Breve descripción de lo que necesitas"
          />
        </div>

        <button type="submit">Agendar cita</button>
      </form>

      <h3>Citas agendadas ({citas.length})</h3>
      {citas.length === 0 ? (
        <p>Aún no hay citas agendadas.</p>
      ) : (
        <ul className="appointments-list">
          {citas
            .slice()
            .sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`))
            .map((cita) => (
              <li key={cita.id}>
                <strong>{cita.nombre}</strong>
                <div>{formatDateTime(cita.fecha, cita.hora)}</div>
                {cita.notas && <div className="notes">{cita.notas}</div>}
                <button onClick={() => borrarCita(cita.id)}>Eliminar</button>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

export default AppointmentCalendar;
