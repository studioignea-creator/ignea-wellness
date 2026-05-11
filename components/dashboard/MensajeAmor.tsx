"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const MENSAJES = [
  "Te amo, mi luz ✨",
  "Te amo, mi todo 💜",
  "Te amo, mi reina 👑",
  "Eres la mejor esposa del mundo 🌸",
  "Gracias por existir en mi vida 💫",
  "Eres increíble, Amanda 🌺",
  "Cada día me enamoro más de ti 💜",
  "Eres mi lugar favorito en el mundo 🌙",
  "Lo que haces aquí importa — y tú importas más 💗",
  "Hoy va a ser un día hermoso, igual que tú 🌿",
  "Eres la mujer más especial que conozco 💐",
  "Mi vida contigo es el mejor regalo 🎁",
];

export default function MensajeAmor() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const idx = Math.floor(Math.random() * MENSAJES.length);
    setMensaje(MENSAJES[idx]);
  }, []);

  if (!mensaje) return null;

  return (
    <div
      className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-3"
      style={{ background: "linear-gradient(135deg, #f5d9d6, #d4e1e2)" }}
    >
      <Heart className="h-5 w-5 shrink-0 fill-current" style={{ color: "#e4a691" }} />
      <p className="text-sm font-medium italic" style={{ color: "#49517e" }}>
        {mensaje}
      </p>
    </div>
  );
}
