import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Film, Search, Heart, Clock, User, LogOut, Star, Play, ChevronLeft, ChevronRight, X, Menu, Sparkles } from 'lucide-react';
import { WatchProvidersSection } from './components/WatchProvidersSection';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
});

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('@MatrixFilmes:token'));
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'HOME' | 'FAVORITES' | 'WATCH_LATER' | 'AUTH' | 'PROFILE'>('HOME');

  // Catálogo e Géneros
  const [catalog, setCatalog] = useState<{
    popularMovies: any[];
    nowPlayingMovies: any[];
    popularTv: any[];
    genres: any[];
  }>({ popularMovies: [], nowPlayingMovies: [], popularTv: [], genres: [] });

  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreResults, setGenreResults] = useState<any[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Pesquisa
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal de Detalhes
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  // Listas
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchLater, setWatchLater] = useState<any[]>([]);

  // Auth
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    } else {
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setFavorites([]);
      setWatchLater([]);
    }
  }, [token]);

  useEffect(() => {
    if (selectedGenre !== null) {
      loadGenreContent(selectedGenre, page);
    } else {
      loadCatalog();
    }
  }, [page, selectedGenre]);

  const fetchUserData = async () => {
    try {
      const [meRes, listsRes] = await Promise.all([api.get('/auth/me'), api.get('/lists')]);
      setUser(meRes.data);
      setFavorites(listsRes.data.favorites);
      setWatchLater(listsRes.data.watchLater);
    } catch {
      handleLogout();
    }
  };

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog/home', { params: { page } });
      setCatalog(res.data.data);
      setTotalPages(res.data.data.totalPages || 10);
    } catch {
      console.warn('Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const loadGenreContent = async (genreId: number, p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/catalog/genre/${genreId}`, { params: { page: p } });
      setGenreResults(res.data.data.results || []);
      setTotalPages(res.data.data.totalPages || 10);
    } catch {
      console.warn('Erro ao carregar género');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setSelectedGenre(null);
    setLoading(true);
    try {
      const res = await api.get(`/catalog/search`, { params: { query: searchQuery } });
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (input: any, mediaTypeParam?: 'MOVIE' | 'TV') => {
    let tmdbId: number;
    let mediaType: 'MOVIE' | 'TV' = mediaTypeParam || 'MOVIE';
    let baseItem: any = null;

    if (typeof input === 'object' && input !== null) {
      baseItem = input;
      tmdbId = input.tmdbId;
      mediaType = input.mediaType || 'MOVIE';
    } else {
      tmdbId = Number(input);
      mediaType = mediaTypeParam || 'MOVIE';
      const allItems = [
        ...catalog.popularMovies,
        ...catalog.nowPlayingMovies,
        ...catalog.popularTv,
        ...searchResults,
        ...genreResults,
        ...favorites,
        ...watchLater
      ];
      baseItem = allItems.find(i => i.tmdbId === tmdbId);
    }

    if (baseItem) {
      setSelectedMedia(baseItem);
    } else {
      setSelectedMedia({ tmdbId, mediaType, title: 'Carregando detalhes...' });
    }

    try {
      const routeType = mediaType === 'TV' ? 'tv' : 'movie';
      const res = await api.get(`/catalog/${routeType}/${tmdbId}`);
      if (res.data && res.data.data) {
        setSelectedMedia(res.data.data);
      }
    } catch {
      // Mantém dados básicos
    }
  };

  const handleToggleList = async (e: React.MouseEvent, media: any, listType: 'FAVORITE' | 'WATCH_LATER') => {
    e.stopPropagation(); // Impede que o clique abra o modal de detalhes
    if (!token) {
      setSelectedMedia(null);
      setActiveTab('AUTH');
      return;
    }
    try {
      await api.post('/lists/toggle', {
        tmdbId: media.tmdbId,
        mediaType: media.mediaType || 'MOVIE',
        listType,
        title: media.title,
        posterUrl: media.posterUrl || media.posterPath,
        voteAverage: media.voteAverage,
        releaseYear: media.releaseYear,
      });
      const listsRes = await api.get('/lists');
      setFavorites(listsRes.data.favorites);
      setWatchLater(listsRes.data.watchLater);
    } catch {
      alert('Erro ao atualizar lista.');
    }
  };

  const isInList = (tmdbId: number, listType: 'FAVORITE' | 'WATCH_LATER') => {
    const list = listType === 'FAVORITE' ? favorites : watchLater;
    return list.some((i) => i.tmdbId === tmdbId);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
      const payload = isLoginMode ? { email: authEmail, password: authPassword } : { name: authName, email: authEmail, password: authPassword };
      const res = await api.post(endpoint, payload);
      localStorage.setItem('@MatrixFilmes:token', res.data.token);
      setToken(res.data.token);
      setActiveTab('HOME');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Erro na autenticação.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@MatrixFilmes:token');
    setToken(null);
    setActiveTab('HOME');
  };

  const heroMovie = catalog.popularMovies[0];
  const currentGenreName = selectedGenre !== null ? catalog.genres.find((g: any) => g.id === selectedGenre)?.name : 'Todos / Início';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 font-sans selection:bg-red-600 selection:text-white pb-24 overflow-x-hidden">
      {/* Navbar Estilo Netflix */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0e14]/95 border-b border-slate-800/60 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <button onClick={() => { setActiveTab('HOME'); setSelectedGenre(null); setIsSearching(false); setSearchQuery(''); setSelectedMedia(null); }} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-black tracking-wider text-red-600">MATRIX</span>
              </div>
            </button>

            {/* Menu Dropdown de Categorias */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151922] border border-slate-800 text-xs font-bold text-slate-300 hover:border-red-500/50 hover:text-white transition-all"
              >
                <Menu className="w-4 h-4 text-red-500" />
                <span>Navegar: {currentGenreName}</span>
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute top-12 left-0 w-72 max-h-96 overflow-y-auto bg-[#151922] border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setSelectedGenre(null); setPage(1); setIsCategoryMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedGenre === null ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                  >
                    🔥 Todos / Início
                  </button>
                  {catalog.genres.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => { setSelectedGenre(g.id); setPage(1); setIsCategoryMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedGenre === g.id ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex items-center relative">
            <input
              type="text"
              placeholder="Títulos, pessoas, géneros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151922] border border-slate-800 rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          </form>

          <nav className="flex items-center gap-3">
            <button onClick={() => { setActiveTab('FAVORITES'); setSelectedMedia(null); }} className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'FAVORITES' ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'text-slate-300 hover:bg-[#151922] hover:text-white'}`}>
              <Heart className="w-4 h-4 text-red-400" /> <span className="hidden sm:inline">Favoritos</span> ({favorites.length})
            </button>
            <button onClick={() => { setActiveTab('WATCH_LATER'); setSelectedMedia(null); }} className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'WATCH_LATER' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-300 hover:bg-[#151922] hover:text-white'}`}>
              <Clock className="w-4 h-4 text-slate-400" /> <span className="hidden sm:inline">Guardados</span> ({watchLater.length})
            </button>
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => { setActiveTab('PROFILE'); setSelectedMedia(null); }} className="px-3.5 py-2 rounded-xl bg-[#151922] border border-slate-800 text-sm font-semibold text-slate-200 flex items-center gap-2 hover:border-slate-700">
                  <User className="w-4 h-4 text-red-500" /> {user.name.split(' ')[0]}
                </button>
                <button onClick={handleLogout} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all" title="Terminar Sessão">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => { setActiveTab('AUTH'); setSelectedMedia(null); }} className="ml-2 px-5 py-2 rounded-xl bg-red-600 text-white font-extrabold text-sm shadow-lg shadow-red-900/30 hover:bg-red-700 transition-all">
                Entrar
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Seletor Mobile de Categoria */}
      <div className="max-w-7xl mx-auto px-6 pt-6 lg:hidden">
        <button
          onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#151922] border border-slate-800 text-sm font-bold text-slate-200"
        >
          <div className="flex items-center gap-2">
            <Menu className="w-4 h-4 text-red-500" />
            <span>Navegar: {currentGenreName}</span>
          </div>
          <span>▾</span>
        </button>
        {isCategoryMenuOpen && (
          <div className="mt-2 w-full max-h-60 overflow-y-auto bg-[#151922] border border-slate-800 rounded-xl p-2 shadow-2xl z-50 grid grid-cols-1 gap-1">
            <button
              onClick={() => { setSelectedGenre(null); setPage(1); setIsCategoryMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold ${selectedGenre === null ? 'bg-red-600 text-white' : 'text-slate-300'}`}
            >
              🔥 Todos / Início
            </button>
            {catalog.genres.map((g: any) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGenre(g.id); setPage(1); setIsCategoryMenuOpen(false); }}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-bold ${selectedGenre === g.id ? 'bg-red-600 text-white' : 'text-slate-300'}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Vista por Género Selecionado */}
        {activeTab === 'HOME' && !isSearching && selectedGenre !== null && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-2.5 h-6 rounded-full bg-red-600" /> 
                {currentGenreName}
              </h2>
              <button onClick={() => setSelectedGenre(null)} className="text-xs text-red-400 font-bold hover:underline">Limpar Categoria</button>
            </div>
            {genreResults.length === 0 ? (
              <p className="text-slate-500 py-16 text-center">A carregar títulos desta categoria...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {genreResults.map((item) => (
                  <MovieCard key={`genre-${item.tmdbId}`} item={item} onOpen={openDetails} onToggle={handleToggleList} isInList={isInList} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Vista Normal Home */}
        {activeTab === 'HOME' && !isSearching && selectedGenre === null && (
          <>
            {heroMovie && (
              <div className="relative h-[480px] md:h-[560px] w-full rounded-2xl overflow-hidden mb-12 shadow-2xl border border-slate-800">
                <div className="absolute inset-0">
                  <img src={heroMovie.backdropUrl || heroMovie.posterUrl} alt={heroMovie.title} className="w-full h-full object-cover filter brightness-75" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-transparent to-transparent" />
                </div>
                <div className="relative max-w-2xl h-full flex flex-col justify-end p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-red-600/20 border border-red-500/40 text-red-300 text-xs px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-red-400" /> Destaque
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-extrabold text-xs bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {heroMovie.voteAverage}
                    </span>
                    <span className="text-slate-300 text-xs font-semibold">{heroMovie.releaseYear}</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">{heroMovie.title}</h1>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed line-clamp-3 mb-6">{heroMovie.overview}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openDetails(heroMovie)} className="px-6 py-3 rounded-xl bg-white text-black font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg hover:bg-slate-200 transition-all">
                      <Play className="w-4 h-4 fill-black" /> Assistir / Detalhes
                    </button>
                    <button onClick={(e) => handleToggleList(e, heroMovie, 'FAVORITE')} className={`p-3 rounded-xl border backdrop-blur-md transition-all ${isInList(heroMovie.tmdbId, 'FAVORITE') ? 'bg-red-600 border-red-500 text-white' : 'bg-black/50 border-slate-700 text-slate-200 hover:border-red-500'}`}>
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Secções em Carrossel Horizontal (Pique Netflix) */}
            <HorizontalCarousel title="Filmes Populares" items={catalog.popularMovies} onOpen={openDetails} onToggle={handleToggleList} isInList={isInList} />
            <HorizontalCarousel title="Em Cartaz nos Cinemas" items={catalog.nowPlayingMovies} onOpen={openDetails} onToggle={handleToggleList} isInList={isInList} />
            <HorizontalCarousel title="Séries de TV em Destaque" items={catalog.popularTv} onOpen={openDetails} onToggle={handleToggleList} isInList={isInList} />
          </>
        )}

        {/* Paginação */}
        {activeTab === 'HOME' && !isSearching && (
          <div className="flex items-center justify-center gap-6 py-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-5 py-2.5 rounded-xl bg-[#151922] border border-slate-800 text-xs font-bold disabled:opacity-30 hover:border-red-500 transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-xs font-bold text-slate-400">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-5 py-2.5 rounded-xl bg-[#151922] border border-slate-800 text-xs font-bold hover:border-red-500 transition-all flex items-center gap-1.5"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Resultados de Pesquisa */}
        {isSearching && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">Resultados para: "{searchQuery}"</h2>
              <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-xs font-bold text-red-400 hover:underline">Limpar Pesquisa</button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-slate-500 py-20 text-center text-lg">Nenhum título encontrado com este nome.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {searchResults.map((item) => (
                  <MovieCard key={`search-${item.tmdbId}`} item={item} onOpen={openDetails} onToggle={handleToggleList} isInList={isInList} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favoritos e Assistir Depois */}
        {(activeTab === 'FAVORITES' || activeTab === 'WATCH_LATER') && (
          <div className="py-8">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              {activeTab === 'FAVORITES' ? <Heart className="w-6 h-6 text-red-500" /> : <Clock className="w-6 h-6 text-slate-400" />}
              {activeTab === 'FAVORITES' ? 'Meus Favoritos' : 'Guardados para Assistir'}
            </h2>
            {(activeTab === 'FAVORITES' ? favorites : watchLater).length === 0 ? (
              <div className="p-12 text-center bg-[#151922] rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">Ainda não tens itens guardados nesta lista.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {(activeTab === 'FAVORITES' ? favorites : watchLater).map((item) => (
                  <div key={item.id} className="group bg-[#151922] rounded-2xl overflow-hidden border border-slate-800 hover:border-red-500/50 transition-all shadow-xl flex flex-col justify-between">
                    <div onClick={() => openDetails(item)} className="aspect-[2/3] cursor-pointer relative overflow-hidden">
                      {item.posterUrl && <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-bold text-xs text-white truncate">{item.title}</h3>
                      <button onClick={(e) => handleToggleList(e, item, activeTab === 'FAVORITES' ? 'FAVORITE' : 'WATCH_LATER')} className="mt-3 w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Autenticação */}
        {activeTab === 'AUTH' && (
          <div className="max-w-md mx-auto my-16 bg-[#151922] border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-2 text-center">{isLoginMode ? 'Entrar' : 'Criar Conta'}</h2>
            <p className="text-slate-400 text-xs text-center mb-6">Sincroniza os teus favoritos em qualquer lugar</p>
            {authError && <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-semibold">{authError}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Nome</label>
                  <input type="text" placeholder="Teu nome" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500" required />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">E-mail</label>
                <input type="email" placeholder="teu@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Palavra-passe</label>
                <input type="password" placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500" required />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-red-600 font-extrabold text-sm text-white shadow-lg shadow-red-900/30 hover:bg-red-700 transition-all">
                {isLoginMode ? 'Entrar' : 'Cadastrar'}
              </button>
            </form>
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="mt-5 w-full text-center text-xs font-semibold text-red-400 hover:underline">
              {isLoginMode ? 'Ainda não tens conta? Regista-te' : 'Já tens conta? Faz login'}
            </button>
          </div>
        )}

        {/* Perfil */}
        {activeTab === 'PROFILE' && user && (
          <div className="max-w-md mx-auto my-16 bg-[#151922] border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
                {user.name.charAt(0)}
              </div>
              Perfil
            </h2>
            <div className="space-y-3 text-sm bg-[#0b0e14] p-5 rounded-2xl border border-slate-800">
              <p><strong className="text-slate-500">Nome:</strong> <span className="text-white font-semibold">{user.name}</span></p>
              <p><strong className="text-slate-500">E-mail:</strong> <span className="text-white font-semibold">{user.email}</span></p>
              <p><strong className="text-slate-500">Região:</strong> <span className="text-red-400 font-semibold">{user.region}</span></p>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalhes */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex justify-center items-center animate-fadeIn">
          <div className="bg-[#151922] border border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 relative my-8 shadow-2xl">
            <button onClick={() => setSelectedMedia(null)} className="absolute top-5 right-5 p-2.5 rounded-full bg-black/70 hover:bg-red-500/20 text-white transition-all">
              <X className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                {selectedMedia.posterUrl && <img src={selectedMedia.posterUrl} alt={selectedMedia.title} className="rounded-2xl w-full shadow-2xl border border-slate-800" />}
                <button
                  onClick={(e) => handleToggleList(e, selectedMedia, 'FAVORITE')}
                  className={`mt-4 w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isInList(selectedMedia.tmdbId, 'FAVORITE') ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'bg-white text-black hover:bg-slate-200'}`}
                >
                  <Heart className={`w-4 h-4 ${isInList(selectedMedia.tmdbId, 'FAVORITE') ? 'fill-white' : ''}`} />
                  {isInList(selectedMedia.tmdbId, 'FAVORITE') ? 'Nos Favoritos' : 'Adicionar Aos Favoritos'}
                </button>
                <button
                  onClick={(e) => handleToggleList(e, selectedMedia, 'WATCH_LATER')}
                  className={`mt-2.5 w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all ${isInList(selectedMedia.tmdbId, 'WATCH_LATER') ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#0b0e14] border-slate-800 text-slate-300 hover:border-slate-700'}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {isInList(selectedMedia.tmdbId, 'WATCH_LATER') ? 'Na lista Assistir Depois' : 'Assistir Depois'}
                </button>
              </div>
              <div className="md:col-span-2 space-y-5">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 font-bold uppercase">{selectedMedia.mediaType === 'TV' ? 'Série' : 'Filme'}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-black/60 px-2.5 py-0.5 rounded-full"><Star className="w-3.5 h-3.5 fill-amber-400" /> {selectedMedia.voteAverage}</span>
                    <span className="text-xs text-slate-400 font-semibold">{selectedMedia.releaseYear}</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">{selectedMedia.title}</h1>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sinopse</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed bg-[#0b0e14] p-4 rounded-xl border border-slate-800">{selectedMedia.overview}</p>
                </div>
                {selectedMedia.watchProviders && <WatchProvidersSection providers={selectedMedia.watchProviders} movieTitle={selectedMedia.title} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Carrossel Horizontal (Pique Netflix) com Barra Oculta
function HorizontalCarousel({ title, items, onOpen, onToggle, isInList }: any) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 group/row relative">
      <h2 className="text-lg md:text-xl font-black mb-4 tracking-wide text-slate-200 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-red-600" /> {title}
      </h2>
      
      <div className="relative">
        {/* Botão Esquerdo */}
        <button 
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 rounded-r-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 h-24 flex items-center justify-center border-y border-r border-slate-700 shadow-2xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Fila de Filmes Deslizante com Scroll Oculto */}
        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map((item: any) => (
            <div key={item.tmdbId} className="flex-none w-[150px] sm:w-[175px] md:w-[200px]">
              <MovieCard item={item} onOpen={onOpen} onToggle={onToggle} isInList={isInList} />
            </div>
          ))}
        </div>

        {/* Botão Direito */}
        <button 
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 rounded-l-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 h-24 flex items-center justify-center border-y border-l border-slate-700 shadow-2xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}

// Componente de Cartão de Filme Individual
function MovieCard({ item, onOpen, onToggle, isInList }: any) {
  return (
    <div className="group bg-[#151922] rounded-2xl overflow-hidden border border-slate-800/80 hover:border-red-500 transition-all duration-300 shadow-lg flex flex-col justify-between hover:scale-105 hover:z-10">
      <div>
        <div onClick={() => onOpen(item)} className="aspect-[2/3] cursor-pointer relative overflow-hidden">
          {item.posterUrl ? (
            <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-[#0b0e14] flex items-center justify-center text-[10px] text-slate-600 font-semibold">Sem Imagem</div>
          )}
          <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-bold text-amber-400 border border-amber-500/20 shadow">
            <Star className="w-3 h-3 fill-amber-400" /> {item.voteAverage}
          </div>
        </div>
        <div className="p-3">
          <h3 onClick={() => onOpen(item)} className="font-bold text-xs text-white truncate cursor-pointer hover:text-red-400 transition-colors" title={item.title}>
            {item.title}
          </h3>
        </div>
      </div>
      <div className="px-3 pb-3 pt-0 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 mt-0.5 pt-2">
        <span className="font-semibold">{item.releaseYear}</span>
        <div className="flex gap-1.5">
          <button
            onClick={(e) => onToggle(e, item, 'FAVORITE')}
            className={`p-1.5 rounded-lg border transition-all ${isInList(item.tmdbId, 'FAVORITE') ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
            title="Favorito"
          >
            <Heart className={`w-3 h-3 ${isInList(item.tmdbId, 'FAVORITE') ? 'fill-red-400' : ''}`} />
          </button>
          <button
            onClick={(e) => onToggle(e, item, 'WATCH_LATER')}
            className={`p-1.5 rounded-lg border transition-all ${isInList(item.tmdbId, 'WATCH_LATER') ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
            title="Assistir Depois"
          >
            <Clock className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}