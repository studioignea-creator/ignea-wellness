"use client";

import { useEffect, useState } from "react";

const MENSAJES = [
  { texto: "Te amo, mi luz", emoji: "✨💜✨" },
  { texto: "Te amo, mi todo", emoji: "🌙💫🌙" },
  { texto: "Te amo, mi reina", emoji: "👑💜👑" },
  { texto: "Eres la mejor esposa del mundo", emoji: "🌸💗🌸" },
  { texto: "Gracias por existir en mi vida", emoji: "💫🙏💫" },
  { texto: "Eres increíble, Amanda", emoji: "🌺✨🌺" },
  { texto: "Hoy va a ser un día hermoso, igual que tú", emoji: "🌅💜🌅" },
  { texto: "Mi vida contigo es el mejor regalo", emoji: "🎁💜🎁" },
  { texto: "Eres la mujer más mágica del mundo", emoji: "🪄💜🪄" },
  { texto: "Eres la esposa más preciosa y perfecta", emoji: "💍🥰💍" },
  { texto: "Eres el mejor regalo que me ha dado la vida", emoji: "🎁✨🎁" },
  { texto: "Eres la mejor compañera de vida y de aventuras", emoji: "🌍💜🌍" },
  { texto: "Ser tu esposo es lo mejor del mundo", emoji: "💜🙏💜" },
  { texto: "Eres la mejor CF del mundo", emoji: "⭐💗⭐" },
  { texto: "Eres la mejor facilitadora de Access Puerto Vallarta (hasta el Munchi lo sabe)", emoji: "🌊🐶🌊" },
  { texto: "Eres la borrega del mes", emoji: "🐑🏆🐑" },
  { texto: "Eres mi borrega favorita", emoji: "🐑💜🐑" },
  { texto: "Hay una cucaracha :0", emoji: "🪳😱🪳" },
];

const HEARTS = ["💜", "💗", "✨", "🌸", "💫"];

function FloatingHeart({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <span
      className="absolute pointer-events-none select-none"
      style={{
        fontSize: "1.1rem",
        animation: "floatUp 3s ease-in-out infinite",
        ...style,
      }}
    >
      {emoji}
    </span>
  );
}

export default function MensajeAmor() {
  const [mensaje, setMensaje] = useState<{ texto: string; emoji: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [hearts, setHearts] = useState<{ emoji: string; left: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * MENSAJES.length);
    setMensaje(MENSAJES[idx]);
    setTimeout(() => setVisible(true), 100);

    const h = Array.from({ length: 6 }, () => ({
      emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
      left: `${Math.random() * 85 + 5}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2.5 + Math.random() * 2}s`,
    }));
    setHearts(h);
  }, []);

  if (!mensaje) return null;

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) scale(1);   opacity: 0.7; }
          50%  { transform: translateY(-18px) scale(1.15); opacity: 1; }
          100% { transform: translateY(0px) scale(1);   opacity: 0.7; }
        }
        @keyframes fadeSlideIn {
          0%   { opacity: 0; transform: translateY(12px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
      `}</style>

      <div
        className="relative overflow-hidden rounded-2xl px-5 py-5 mb-5"
        style={{
          background: "linear-gradient(135deg, #f5d9d6 0%, #e8d4e8 50%, #d4e1e2 100%)",
          boxShadow: "0 4px 20px rgba(132,113,155,0.15)",
          opacity: visible ? 1 : 0,
          animation: visible ? "fadeSlideIn 0.7s ease forwards" : "none",
        }}
      >
        {/* Floating hearts */}
        {hearts.map((h, i) => (
          <FloatingHeart
            key={i}
            emoji={h.emoji}
            style={{
              left: h.left,
              bottom: "4px",
              animationDelay: h.delay,
              animationDuration: h.duration,
              opacity: 0.6,
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 text-center">
          <p
            className="text-lg font-semibold mb-1"
            style={{
              color: "#49517e",
              fontStyle: "italic",
              letterSpacing: "0.01em",
              animation: "pulse-soft 4s ease-in-out infinite",
            }}
          >
            {mensaje.texto}
          </p>
          <p className="text-xl" style={{ letterSpacing: "0.1em" }}>
            {mensaje.emoji}
          </p>
        </div>
      </div>
    </>
  );
}
