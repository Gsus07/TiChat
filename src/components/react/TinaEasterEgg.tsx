import React, { useState, useRef, useEffect } from 'react';

interface TinaEasterEggProps {
  variant?: 'home' | 'login';
  className?: string;
  imageClassName?: string;
  showSpeechBubble?: boolean;
  speechBubbleClassName?: string;
}

const TinaEasterEgg: React.FC<TinaEasterEggProps> = ({
  variant = 'home',
  className = '',
  imageClassName = '',
  showSpeechBubble = false,
  speechBubbleClassName = ''
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [message, setMessage] = useState(
    variant === 'login' ? '¡Hola! Soy Tina 🐱' : '¡Tina te da la bienvenida! 🐾'
  );
  const [showCounter, setShowCounter] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('');
  const effectsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // Nuevo: control del video como easter egg
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const messages = variant === 'login' ? [
    "¡Miau! Bienvenido 🐱",
    "¡Tina te ayuda a entrar! 😸",
    "¡Ronroneo de bienvenida! 😻",
    "¡Más caricias! 🐾",
    "¡Soy tu guardiana! 💖",
    "¡Miau miau! 🎵",
    "¡Protegiendo tu login! 🛡️",
    "¡Tina te cuida! ❤️",
    "¡Purr purr! 😽",
    "¡Acceso autorizado! ✨"
  ] : [
    "¡Miau! 🐱",
    "¡Tina está feliz! 😸",
    "¡Ronroneo activado! 😻",
    "¡Más caricias por favor! 🐾",
    "¡Soy la mascota oficial! 💖",
    "¡Miau miau! 🎵",
    "¡Bienvenido a TiChat! 🎮",
    "¡Tina te protege! ❤️",
    "¡Purr purr! 😽",
    "¡Juguemos juntos! 🎯"
  ];

  // Función para crear efecto de corazón
  const createHeartEffect = (x: number, y: number) => {
    if (!effectsRef.current) return;

    const heart = document.createElement('div');
    heart.innerHTML = '💖';
    heart.style.position = 'absolute';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = '20px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '1000';
    heart.style.animation = 'heartFloat 2s ease-out forwards';

    effectsRef.current.appendChild(heart);

    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart);
      }
    }, 2000);
  };

  // Función para crear efecto de huella
  const createPawEffect = () => {
    if (!effectsRef.current) return;

    const paw = document.createElement('div');
    paw.innerHTML = `
      <svg width="24" height="24" fill="#f97316" viewBox="0 0 24 24">
        <ellipse cx="8" cy="6" rx="2" ry="3" fill="currentColor"/>
        <ellipse cx="16" cy="6" rx="2" ry="3" fill="currentColor"/>
        <ellipse cx="6" cy="12" rx="1.5" ry="2" fill="currentColor"/>
        <ellipse cx="18" cy="12" rx="1.5" ry="2" fill="currentColor"/>
        <ellipse cx="12" cy="16" rx="4" ry="5" fill="currentColor"/>
      </svg>
    `;
    paw.style.position = 'absolute';
    paw.style.top = '50%';
    paw.style.left = '50%';
    paw.style.transform = 'translate(-50%, -50%)';
    paw.style.pointerEvents = 'none';
    paw.style.zIndex = '999';
    paw.style.animation = 'pawSpin 1s ease-out forwards';

    effectsRef.current.appendChild(paw);

    setTimeout(() => {
      if (paw.parentNode) {
        paw.parentNode.removeChild(paw);
      }
    }, 1000);
  };

  // Función para reproducir sonido de maullido
  const playMeowSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (variant === 'login') {
        oscillator.frequency.setValueAtTime(350, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
      } else {
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (error) {
      // Audio no disponible
    }
  };

  // Manejar click en TTina
  const handleTinaClick = (e: React.MouseEvent) => {
    // Si el video está reproduciéndose, ignorar clics para no interrumpir la transición
    if (isVideoPlaying) return;

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // Mostrar contador después de 3 clics
    if (newClickCount >= 3) {
      setShowCounter(true);
    }

    // Cambiar mensaje aleatoriamente
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMessage);

    // Efectos visuales
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      createHeartEffect(
        centerX + (Math.random() - 0.5) * (variant === 'login' ? 100 : 200),
        centerY + (Math.random() - 0.5) * (variant === 'login' ? 100 : 200)
      );
    }

    createPawEffect();

    // Animaciones especiales
    setCurrentAnimation('');
    setTimeout(() => {
      if (variant === 'login') {
        if (newClickCount % 7 === 0) {
          setCurrentAnimation('spin 1s ease-in-out, bounce 0.5s ease-in-out');
        } else if (newClickCount % 4 === 0) {
          setCurrentAnimation('wiggle 0.5s ease-in-out');
        } else {
          setCurrentAnimation('bounce 0.5s ease-in-out');
        }
      } else {
        if (newClickCount % 5 === 0) {
          setCurrentAnimation('spin 1s ease-in-out, bounce 0.5s ease-in-out');
        } else if (newClickCount % 3 === 0) {
          setCurrentAnimation('wiggle 0.5s ease-in-out');
        } else {
          setCurrentAnimation('bounce 0.5s ease-in-out');
        }
      }
    }, 10);

    // Sonido de maullido
    playMeowSound();

    // Nuevo easter egg: transición imagen → video tras N clics
    const videoThreshold = variant === 'login' ? 12 : 7; // puedes ajustar estos valores
    if (newClickCount % videoThreshold === 0) {
      setIsVideoPlaying(true);
      // Intentar reproducir por si el autoplay es bloqueado
      setTimeout(() => {
        try {
          videoRef.current?.play();
        } catch {}
      }, 100);
    }

    // Easter egg especial existente
    const specialClickThreshold = variant === 'login' ? 15 : 10;
    if (newClickCount % specialClickThreshold === 0) {
      const specialMessage = variant === 'login' 
        ? `¡GUARDIANA SUPREMA! ${newClickCount} clics de protección! 🌟`
        : `¡Miau mágico! 🪄 Has descubierto mi poder felino ${newClickCount} veces! ✨🐾`;
      
      setMessage(specialMessage);

      // Efectos especiales
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Lluvia de corazones
        const heartCount = variant === 'login' ? 3 : 5;
        for (let i = 0; i < heartCount; i++) {
          setTimeout(() => {
            createHeartEffect(
              centerX + (Math.random() - 0.5) * (variant === 'login' ? 150 : 200),
              centerY + (Math.random() - 0.5) * (variant === 'login' ? 150 : 200)
            );
          }, i * (variant === 'login' ? 300 : 200));
        }
      }

      // Resetear efectos especiales después de 3 segundos
      setTimeout(() => {
        setMessage(variant === 'login' ? '¡Hola! Soy TTina 🐱' : '¡TTina te da la bienvenida! 🐾');
      }, 3000);
    }

    // Resetear animación
    setTimeout(() => {
      setCurrentAnimation(variant === 'login' ? '' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite');
    }, 1000);
  };

  // Estilos CSS para las animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes heartFloat {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(-${variant === 'login' ? '80px' : '100px'}) scale(0.5);
          opacity: 0;
        }
      }
      
      @keyframes pawSpin {
        0% {
          transform: rotate(0deg) scale(1);
          opacity: 1;
        }
        100% {
          transform: rotate(360deg) scale(0);
          opacity: 0;
        }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0,0,0);
        }
        40%, 43% {
          transform: translate3d(0,${variant === 'login' ? '-20px' : '-30px'},0);
        }
        70% {
          transform: translate3d(0,${variant === 'login' ? '-10px' : '-15px'},0);
        }
        90% {
          transform: translate3d(0,${variant === 'login' ? '-3px' : '-4px'},0);
        }
      }
      
      @keyframes wiggle {
        0%, 7% {
          transform: rotateZ(0);
        }
        15% {
          transform: rotateZ(${variant === 'login' ? '-10deg' : '-15deg'});
        }
        20% {
          transform: rotateZ(${variant === 'login' ? '8deg' : '12deg'});
        }
        25% {
          transform: rotateZ(${variant === 'login' ? '-6deg' : '-9deg'});
        }
        30% {
          transform: rotateZ(4deg);
        }
        35% {
          transform: rotateZ(-2deg);
        }
        40%, 100% {
          transform: rotateZ(0);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [variant]);

  const defaultImageClasses = variant === 'login'
    ? "w-32 h-32 mx-auto rounded-full shadow-2xl border-4 border-calico-orange-300 hover:scale-105 transition-transform duration-300 cursor-pointer select-none"
    : "w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300 animate-none cursor-pointer select-none";

  return (
    <div className={`relative ${className}`}>
      {/* Speech Bubble para variante home */}
      {showSpeechBubble && variant === 'home' && (
        <div className={`absolute -left-20 sm:-left-24 md:-left-28 lg:-left-40 -top-4 sm:-top-6 md:-top-8 lg:-top-12 z-10 ${speechBubbleClassName}`}>
          <div className="relative bg-gradient-to-br from-white to-calico-cream rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-calico-orange-300 p-3 sm:p-4 md:p-5 lg:p-6 max-w-xs sm:max-w-sm animate-pulse-slow backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-calico-orange-100 to-calico-gray-100 rounded-2xl md:rounded-3xl opacity-20 blur-sm"></div>
            <div className="relative z-10">
              <p className="text-slate-800 text-sm sm:text-base md:text-base lg:text-lg font-semibold transition-all duration-500 leading-relaxed text-center">
                {message}
              </p>
            </div>
            <div className="absolute top-2 right-2 md:right-3 w-3 h-3 md:w-4 md:h-4 text-calico-orange-400 opacity-50">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <ellipse cx="8" cy="6" rx="2" ry="3" fill="currentColor"/>
                <ellipse cx="16" cy="6" rx="2" ry="3" fill="currentColor"/>
                <ellipse cx="6" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                <ellipse cx="18" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                <ellipse cx="12" cy="16" rx="4" ry="5" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 md:left-3 flex space-x-1">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-calico-orange-400 rounded-full opacity-60 animate-pulse"></div>
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-calico-orange-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Imagen y Video con transición */}
      <div className="relative">
        <img
          ref={imageRef}
          src="/TTina.png"
          alt="TTina - Mascota de TiChat"
          className={`${imageClassName || defaultImageClasses} transition-opacity duration-700 ${isVideoPlaying ? 'opacity-0' : 'opacity-100'}`}
          title="¡Haz clic en TTina! 🐱"
          onClick={handleTinaClick}
          style={{
            animation: currentAnimation || (variant === 'home' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : '')
          }}
        />
        <video
          ref={videoRef}
          src="/edit_vd_tina.mp4"
          className={`${imageClassName || defaultImageClasses} absolute inset-0 transition-opacity duration-700 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'} pointer-events-none object-cover`}
          muted
          playsInline
          preload="metadata"
          autoPlay={isVideoPlaying}
          onEnded={() => {
            setIsVideoPlaying(false);
            setCurrentAnimation(variant === 'home' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : '');
          }}
        />
      </div>

      {/* Mensaje para variante login */}
      {variant === 'login' && (
        <p className="text-calico-gray-700 text-sm mt-2 font-medium transition-all duration-500">
          {message}
        </p>
      )}

      {/* Contador secreto de clics */}
      <div 
        className={`absolute ${variant === 'login' ? '-top-1 -right-1' : '-top-2 -right-2'} bg-calico-orange-500 text-white text-xs font-bold rounded-full ${variant === 'login' ? 'w-5 h-5' : 'w-6 h-6'} flex items-center justify-center transition-opacity duration-300`}
        style={{ opacity: showCounter ? 1 : 0 }}
      >
        {clickCount}
      </div>

      {/* Contenedor para efectos visuales */}
      <div ref={effectsRef} className="absolute inset-0 pointer-events-none"></div>
    </div>
  );
};

export default TinaEasterEgg;