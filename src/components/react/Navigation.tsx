import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "./NotificationProvider";
import type { Game } from "../../types/game";

interface User {
  name: string;
  avatar?: string;
}

interface UserSession {
  user: User;
}

interface NavigationProps {
  games?: Game[];
}

const Navigation: React.FC<NavigationProps> = ({ games = [] }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearchResults, setShowMobileSearchResults] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });

  // Refs
  const { addNotification } = useNotifications();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const gamesDropdownRef = useRef<HTMLDivElement>(null);
  const gamesButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const mobileSearchResultsRef = useRef<HTMLDivElement>(null);

  // Memoized filtered games for search
  const filteredGames = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        (game.genre && game.genre.toLowerCase().includes(query))
    );
  }, [games, searchQuery]);

  const mobileFilteredGames = useMemo(() => {
    const query = mobileSearchQuery.toLowerCase().trim();
    if (!query) return [];

    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        (game.genre && game.genre.toLowerCase().includes(query))
    );
  }, [games, mobileSearchQuery]);

  // Authentication functions
  const checkAuthStatus = useCallback(() => {
    const userSession =
      localStorage.getItem("userSession") ||
      sessionStorage.getItem("userSession");

    if (userSession) {
      try {
        const session: UserSession = JSON.parse(userSession);
        setUser(session.user);
      } catch (error) {
        console.error("Error parsing user session:", error);
        localStorage.removeItem("userSession");
        sessionStorage.removeItem("userSession");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("userSession");
    sessionStorage.removeItem("userSession");

    addNotification("Sesión cerrada exitosamente", "success");

    setUser(null);
    setIsUserDropdownOpen(false);

    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }, [addNotification]);

  // Dropdown position calculation
  const calculateDropdownPosition = useCallback(
    (buttonElement: HTMLElement) => {
      const rect = buttonElement.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      };
    },
    []
  );

  // Event handlers
  const handleUserMenuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isUserDropdownOpen && userButtonRef.current) {
        const position = calculateDropdownPosition(userButtonRef.current);
        setDropdownPosition(position);
      }

      setIsUserDropdownOpen(!isUserDropdownOpen);
      setIsGamesDropdownOpen(false);
    },
    [isUserDropdownOpen, calculateDropdownPosition]
  );

  const handleGamesMenuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsGamesDropdownOpen(!isGamesDropdownOpen);
      setIsUserDropdownOpen(false);
    },
    [isGamesDropdownOpen]
  );

  const handleMobileMenuClick = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setShowSearchResults(value.trim().length > 0);
    },
    []
  );

  const handleMobileSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMobileSearchQuery(value);
      setShowMobileSearchResults(value.trim().length > 0);
    },
    []
  );

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  }, [searchQuery]);

  const handleMobileSearchFocus = useCallback(() => {
    if (mobileSearchQuery.trim()) {
      setShowMobileSearchResults(true);
    }
  }, [mobileSearchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close user dropdown
      if (
        isUserDropdownOpen &&
        userButtonRef.current &&
        !userButtonRef.current.contains(target) &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setIsUserDropdownOpen(false);
      }

      // Close games dropdown
      if (
        isGamesDropdownOpen &&
        gamesButtonRef.current &&
        !gamesButtonRef.current.contains(target) &&
        gamesDropdownRef.current &&
        !gamesDropdownRef.current.contains(target)
      ) {
        setIsGamesDropdownOpen(false);
      }

      // Close search results
      if (
        showSearchResults &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(target)
      ) {
        setShowSearchResults(false);
      }

      if (
        showMobileSearchResults &&
        mobileSearchInputRef.current &&
        !mobileSearchInputRef.current.contains(target) &&
        mobileSearchResultsRef.current &&
        !mobileSearchResultsRef.current.contains(target)
      ) {
        setShowMobileSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    isUserDropdownOpen,
    isGamesDropdownOpen,
    showSearchResults,
    showMobileSearchResults,
  ]);

  // Listen for storage changes (cross-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userSession" && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Initialize authentication
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Game item component for reusability
  const GameItem: React.FC<{ game: Game; onClick?: () => void }> = ({
    game,
    onClick,
  }) => (
    <a
      href={`/game/${game.id}`}
      onClick={onClick}
      className="group flex items-center px-4 py-3 text-sm text-calico-gray-300 hover:text-calico-white hover:bg-gradient-to-r hover:from-calico-orange-500/10 hover:to-calico-orange-600/10 transition-all duration-300 mx-2 rounded-xl"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-calico-orange-500/20 group-hover:bg-calico-orange-500/30 transition-colors duration-300 mr-3 overflow-hidden">
        {game.cover_image_url ? (
          <img
            src={game.cover_image_url}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </div>
      <div className="flex flex-col flex-1">
        <span className="font-medium">{game.name}</span>
        {game.genre && (
          <span className="text-xs text-calico-gray-400">{game.genre}</span>
        )}
      </div>
    </a>
  );

  return (
    <>
      {/* Desktop Navigation Elements */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Left spacer for balance */}
        <div className="flex-1"></div>

        {/* Right-aligned section with Games, Search, and Authentication */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {/* Games Dropdown */}
          <div className="relative">
            <button
              ref={gamesButtonRef}
              onClick={handleGamesMenuClick}
              className="group relative px-4 py-2.5 rounded-xl text-sm font-semibold text-calico-gray-300 hover:text-calico-white transition-all duration-300 hover:bg-gradient-to-r hover:from-calico-orange-500/20 hover:to-calico-orange-600/20 hover:shadow-lg hover:shadow-calico-orange-500/25 hover:scale-105"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Juegos</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isGamesDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-calico-orange-500 to-calico-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </button>

            {/* Games Dropdown Menu */}
            {isGamesDropdownOpen && (
              <div
                ref={gamesDropdownRef}
                className="absolute right-0 mt-3 w-72 bg-calico-gray-900 rounded-2xl shadow-2xl border border-calico-orange-500/20 py-2 transform transition-all duration-300 origin-top-right scale-100 opacity-100 z-50"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div className="px-4 py-3 border-b border-calico-orange-500/10">
                  <p className="text-sm font-semibold text-calico-white">
                    Juegos Disponibles
                  </p>
                  <p className="text-xs text-calico-gray-400">
                    Explora nuestras comunidades
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {games.map((game) => (
                    <GameItem
                      key={game.id}
                      game={game}
                      onClick={() => setIsGamesDropdownOpen(false)}
                    />
                  ))}
                  {games.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-calico-gray-400">
                        No hay juegos disponibles
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Buscar juegos..."
                className="w-64 px-4 py-2.5 pl-10 pr-4 text-sm bg-gradient-to-r from-calico-dark/60 to-calico-dark/80 border border-calico-orange-500/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500/50 focus:border-calico-orange-500 transition-all duration-300 backdrop-blur-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-calico-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="absolute top-full right-0 mt-2 w-full bg-calico-gray-900 rounded-2xl shadow-2xl border border-calico-orange-500/20 py-2 z-50 max-h-80 overflow-y-auto"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <GameItem
                      key={game.id}
                      game={game}
                      onClick={() => setShowSearchResults(false)}
                    />
                  ))
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-calico-gray-400">
                      No se encontraron juegos
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Guest buttons */}
          {!user && (
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="group relative flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-calico-gray-300 hover:text-calico-white transition-all duration-300 rounded-xl hover:bg-gradient-to-r hover:from-calico-orange-500/10 hover:to-calico-orange-600/10 hover:shadow-lg hover:shadow-calico-orange-500/20"
                style={{ backgroundColor: "var(--bg-accent)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 lucide lucide-log-in-icon lucide-log-in"
                >
                  <path d="m10 17 5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                </svg>
                <span>Iniciar Sesion</span>
              </a>
            </div>
          )}

          {/* User menu */}
          {user && (
            <div className="relative">
              <button
                ref={userButtonRef}
                onClick={handleUserMenuClick}
                className="group flex items-center space-x-3 text-calico-gray-300 hover:text-calico-white transition-all duration-300 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-calico-orange-500/10 hover:to-calico-orange-600/10 hover:shadow-lg hover:shadow-calico-orange-500/20"
              >
                <div className="relative">
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-10 h-10 rounded-xl border-2 border-calico-orange-500/50 group-hover:border-calico-orange-400 transition-all duration-300 shadow-lg group-hover:shadow-calico-orange-500/25"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-calico-dark shadow-lg" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-calico-gray-400">En línea</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isUserDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* User Dropdown Menu with Portal */}
              {isUserDropdownOpen &&
                createPortal(
                  <div
                    ref={userDropdownRef}
                    className="fixed w-56 bg-calico-gray-900 rounded-2xl shadow-2xl border border-calico-orange-500/20 py-2 transform transition-all duration-300 origin-top-right scale-100 opacity-100"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                      zIndex: 2147483647,
                      backgroundColor: "var(--bg-secondary)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-calico-orange-500/10">
                      <p className="text-sm font-semibold text-calico-white">
                        Mi Cuenta
                      </p>
                      <p className="text-xs text-calico-gray-400">
                        Gestiona tu perfil
                      </p>
                    </div>
                    <a
                      href="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="group flex items-center px-4 py-3 text-sm text-calico-gray-300 hover:text-calico-white hover:bg-gradient-to-r hover:from-calico-orange-500/10 hover:to-calico-orange-600/10 transition-all duration-300 mx-2 rounded-xl"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-calico-orange-500/20 group-hover:bg-calico-orange-500/30 transition-colors duration-300 mr-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Mi Perfil</span>
                        <span className="text-xs text-calico-gray-400">
                          Ver y editar perfil
                        </span>
                      </div>
                    </a>
                    <a
                      href="/settings"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="group flex items-center px-4 py-3 text-sm text-calico-gray-300 hover:text-calico-white hover:bg-gradient-to-r hover:from-calico-orange-500/10 hover:to-calico-orange-600/10 transition-all duration-300 mx-2 rounded-xl"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-calico-orange-500/20 group-hover:bg-calico-orange-500/30 transition-colors duration-300 mr-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Configuraciones</span>
                        <span className="text-xs text-calico-gray-400">
                          Preferencias y ajustes
                        </span>
                      </div>
                    </a>
                    <hr className="my-2 border-calico-orange-500/10 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="group flex items-center w-full px-4 py-3 text-sm text-calico-orange-600 hover:text-calico-orange-500 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-calico-orange-500/10 transition-all duration-300 mx-2 rounded-xl"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300 mr-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Cerrar Sesión</span>
                        <span className="text-xs text-calico-gray-400">
                          Salir de tu cuenta
                        </span>
                      </div>
                    </button>
                  </div>,
                  document.body
                )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={handleMobileMenuClick}
        className="md:hidden group p-2 mr-2 rounded-xl text-calico-gray-300 hover:text-calico-white transition-all duration-300 hover:bg-gradient-to-r hover:from-calico-orange-500/10 hover:to-calico-orange-600/10 hover:shadow-lg hover:shadow-calico-orange-500/20"
      >
        <svg
          className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden backdrop-blur-xl bg-gradient-to-b from-calico-dark/95 to-calico-dark/90 border-t border-calico-orange-500/20 shadow-2xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {/* Mobile Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={mobileSearchQuery}
                  onChange={handleMobileSearchChange}
                  onFocus={handleMobileSearchFocus}
                  placeholder="Buscar juegos..."
                  className="w-full px-4 py-2.5 pl-10 pr-4 text-sm bg-gradient-to-r from-calico-dark/60 to-calico-dark/80 border border-calico-orange-500/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500/50 focus:border-calico-orange-500 transition-all duration-300 backdrop-blur-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-calico-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Mobile Search Results */}
              {showMobileSearchResults && (
                <div
                  ref={mobileSearchResultsRef}
                  className="mt-2 bg-calico-gray-900 rounded-2xl shadow-2xl border border-calico-orange-500/20 py-2 max-h-60 overflow-y-auto"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  {mobileFilteredGames.length > 0 ? (
                    mobileFilteredGames.map((game) => (
                      <GameItem
                        key={game.id}
                        game={game}
                        onClick={() => {
                          setShowMobileSearchResults(false);
                          setIsMobileMenuOpen(false);
                        }}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-calico-gray-400">
                        No se encontraron juegos
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-calico-orange-400 uppercase tracking-wider mb-2">
                Navegación
              </h3>
            </div>
            <a
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group flex items-center px-4 py-3 rounded-xl text-base font-semibold text-calico-gray-300 hover:text-calico-white transition-all duration-300 hover:bg-gradient-to-r hover:from-calico-orange-500/20 hover:to-calico-orange-600/20 hover:shadow-lg hover:shadow-calico-orange-500/25"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Inicio
            </a>

            {/* Mobile Games Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-calico-orange-400 uppercase tracking-wider mb-2">
                Juegos
              </h3>
            </div>
            {games.map((game) => (
              <a
                key={game.id}
                href={`/game/${game.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center px-4 py-3 rounded-xl text-base font-semibold text-calico-gray-300 hover:text-calico-white transition-all duration-300 hover:bg-gradient-to-r hover:from-calico-orange-500/20 hover:to-calico-orange-600/20 hover:shadow-lg hover:shadow-calico-orange-500/25"
              >
                <div className="w-5 h-5 mr-3 flex items-center justify-center rounded overflow-hidden">
                  {game.cover_image_url ? (
                    <img
                      src={game.cover_image_url}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                {game.name}
              </a>
            ))}
            {games.length === 0 && (
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-calico-gray-400">
                  No hay juegos disponibles
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
