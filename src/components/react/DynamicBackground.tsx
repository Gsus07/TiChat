import React, { useEffect, useRef, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

const DynamicBackground: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generar elementos geométricos con valores predefinidos para evitar problemas de hidratación
  const geometricElements = [
    { id: 0, size: 45, initialX: 15, initialY: 25, speed: 0.2, rotation: 45 },
    { id: 1, size: 35, initialX: 85, initialY: 15, speed: 0.3, rotation: 120 },
    { id: 2, size: 55, initialX: 25, initialY: 75, speed: 0.15, rotation: 200 },
    { id: 3, size: 40, initialX: 75, initialY: 65, speed: 0.25, rotation: 300 },
    { id: 4, size: 30, initialX: 45, initialY: 35, speed: 0.35, rotation: 80 },
    { id: 5, size: 50, initialX: 65, initialY: 85, speed: 0.18, rotation: 160 },
    { id: 6, size: 38, initialX: 10, initialY: 55, speed: 0.28, rotation: 240 },
    { id: 7, size: 42, initialX: 90, initialY: 45, speed: 0.22, rotation: 320 },
    { id: 8, size: 33, initialX: 35, initialY: 10, speed: 0.32, rotation: 60 },
    { id: 9, size: 48, initialX: 55, initialY: 90, speed: 0.16, rotation: 140 },
    { id: 10, size: 36, initialX: 80, initialY: 30, speed: 0.26, rotation: 220 },
    { id: 11, size: 44, initialX: 20, initialY: 70, speed: 0.24, rotation: 280 },
  ];

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 1 }}
    >
      {/* Efectos de parallax basados en mouse */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${(mousePosition.x - 50) * 0.02}px, ${(mousePosition.y - 50) * 0.02}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Orbes de luz que siguen el mouse */}
        <div
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease-out',
          }}
        />
        
        <div
          className="absolute w-32 h-32 bg-gradient-to-r from-cyan-400/30 to-pink-400/30 rounded-full blur-xl"
          style={{
            left: `${mousePosition.x * 0.8}%`,
            top: `${mousePosition.y * 0.8}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.5s ease-out',
          }}
        />
      </div>

      {/* Elementos geométricos flotantes */}
      <div className="absolute inset-0">
        {geometricElements.map((element) => (
          <div
            key={element.id}
            className="absolute opacity-20"
            style={{
              left: `${element.initialX}%`,
              top: `${element.initialY}%`,
              transform: `
                translate(-50%, -50%) 
                rotate(${element.rotation + (mousePosition.x * 0.1)}deg)
                translate(${(mousePosition.x - 50) * element.speed}px, ${(mousePosition.y - 50) * element.speed}px)
              `,
              transition: 'transform 0.2s ease-out',
            }}
          >
            {element.id % 3 === 0 ? (
              // Triángulos
              <div
                className="border-2 border-blue-400/40"
                style={{
                  width: `${element.size}px`,
                  height: `${element.size}px`,
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                  background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                }}
              />
            ) : element.id % 3 === 1 ? (
              // Círculos
              <div
                className="border border-purple-400/40 rounded-full"
                style={{
                  width: `${element.size}px`,
                  height: `${element.size}px`,
                  background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))',
                }}
              />
            ) : (
              // Cuadrados
              <div
                className="border border-cyan-400/40"
                style={{
                  width: `${element.size}px`,
                  height: `${element.size}px`,
                  background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Ondas de energía */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-blue-400/20 animate-ping"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: `${mousePosition.x}%`,
              top: `${mousePosition.y}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      {/* Líneas de conexión dinámicas */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="50%" stopColor="rgba(147, 51, 234, 0.3)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0.3)" />
          </linearGradient>
        </defs>
        
        {geometricElements.slice(0, 6).map((element, i) => {
          const nextElement = geometricElements[(i + 1) % 6];
          return (
            <line
              key={`line-${i}`}
              x1={`${element.initialX}%`}
              y1={`${element.initialY}%`}
              x2={`${nextElement.initialX}%`}
              y2={`${nextElement.initialY}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              opacity="0.3"
              className="animate-pulse"
            />
          );
        })}
      </svg>

      {/* Partículas flotantes siempre visibles */}
      <div className="absolute inset-0">
        {[
          { left: 12, top: 18, delay: 0.5, duration: 2.5, size: 4, color: 'rgba(59, 130, 246, 0.8)' },
          { left: 78, top: 32, delay: 1.2, duration: 3.2, size: 3, color: 'rgba(147, 51, 234, 0.8)' },
          { left: 35, top: 68, delay: 2.1, duration: 2.8, size: 5, color: 'rgba(236, 72, 153, 0.8)' },
          { left: 88, top: 85, delay: 0.8, duration: 3.5, size: 4, color: 'rgba(6, 182, 212, 0.8)' },
          { left: 22, top: 45, delay: 1.8, duration: 2.2, size: 3, color: 'rgba(255, 255, 255, 0.9)' },
          { left: 65, top: 15, delay: 0.3, duration: 3.0, size: 4, color: 'rgba(59, 130, 246, 0.7)' },
          { left: 45, top: 80, delay: 1.5, duration: 2.7, size: 3, color: 'rgba(147, 51, 234, 0.7)' },
          { left: 90, top: 60, delay: 2.3, duration: 3.1, size: 5, color: 'rgba(236, 72, 153, 0.7)' },
        ].map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: 0.8,
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
              animation: `floatParticle ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Efectos de destello */}
      <div className="absolute inset-0">
        {[
          { left: 25, top: 25, delay: 0.5, duration: 2.5 },
          { left: 75, top: 40, delay: 1.2, duration: 3.2 },
          { left: 40, top: 75, delay: 2.1, duration: 2.8 },
          { left: 85, top: 20, delay: 0.8, duration: 3.5 },
          { left: 15, top: 60, delay: 1.8, duration: 2.2 },
        ].map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
            }}
          />
        ))}
      </div>


    </div>
  );
};

export default DynamicBackground;