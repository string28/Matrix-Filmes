import dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // Cache de 10 minutos

export class TmdbService {
  private api: AxiosInstance;
  private imageBase = 'https://image.tmdb.org/t/p/w500';
  private backdropBase = 'https://image.tmdb.org/t/p/original';

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'pt-BR',
      },
    });
  }

  // Formatador padrão de itens do TMDB
  private formatMedia(item: any, mediaType: 'MOVIE' | 'TV') {
    return {
      tmdbId: item.id,
      mediaType,
      title: item.title || item.name || 'Título Desconhecido',
      overview: item.overview || 'Sem sinopse disponível.',
      posterUrl: item.poster_path ? `${this.imageBase}${item.poster_path}` : null,
      backdropUrl: item.backdrop_path ? `${this.backdropBase}${item.backdrop_path}` : null,
      voteAverage: item.vote_average ? Number(item.vote_average.toFixed(1)) : 0,
      releaseYear: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A',
    };
  }

  async getHomeCatalog(page = 1) {
    const cacheKey = `home_catalog_p${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached, fromFallback: false };

    try {
      const [popularMoviesRes, nowPlayingRes, popularTvRes, genresRes] = await Promise.all([
        this.api.get('/movie/popular', { params: { page } }),
        this.api.get('/movie/now_playing', { params: { page } }),
        this.api.get('/tv/popular', { params: { page } }),
        this.api.get('/genre/movie/list'),
      ]);

      const popularMovies = popularMoviesRes.data.results.map((m: any) => this.formatMedia(m, 'MOVIE'));
      const popularIds = new Set(popularMovies.map((m: any) => m.tmdbId));

      const nowPlayingMovies = nowPlayingRes.data.results
        .map((m: any) => this.formatMedia(m, 'MOVIE'))
        .filter((m: any) => !popularIds.has(m.tmdbId));

      const popularTv = popularTvRes.data.results.map((t: any) => this.formatMedia(t, 'TV'));

      const data = {
        page,
        popularMovies,
        nowPlayingMovies,
        popularTv,
        genres: genresRes.data.genres,
        totalPages: Math.min(popularMoviesRes.data.total_pages, 500),
      };

      cache.set(cacheKey, data);
      return { data, fromFallback: false };
    } catch (error) {
      console.error('[TMDB Home Catalog Error]:', (error as Error).message);
      return { data: null, fromFallback: true };
    }
  }

  async getMovieDetails(id: number) {
    const cacheKey = `movie_details_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached, fromFallback: false };

    try {
      const res = await this.api.get(`/movie/${id}`);
      const movie = res.data;

      let watchData = null;
      try {
        const providersRes = await this.api.get(`/movie/${id}/watch/providers`);
        watchData = providersRes.data.results?.['BR'] || null;
      } catch {
        // Ignora caso não existam provedores
      }

      const formatted = {
        ...this.formatMedia(movie, 'MOVIE'),
        runtime: movie.runtime,
        genres: movie.genres,
        watchProviders: {
          region: 'BR',
          tmdbWatchLink: watchData?.link || null,
          flatrate: (watchData?.flatrate || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          free: (watchData?.free || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          ads: (watchData?.ads || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          rent: (watchData?.rent || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          buy: (watchData?.buy || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
        },
      };

      cache.set(cacheKey, formatted);
      return { data: formatted, fromFallback: false };
    } catch (error) {
      console.error('[TMDB Movie Details Error]:', (error as Error).message);
      return { data: null, fromFallback: true };
    }
  }

  async getTvDetails(id: number) {
    const cacheKey = `tv_details_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached, fromFallback: false };

    try {
      const res = await this.api.get(`/tv/${id}`);
      const tv = res.data;

      let watchData = null;
      try {
        const providersRes = await this.api.get(`/tv/${id}/watch/providers`);
        watchData = providersRes.data.results?.['BR'] || null;
      } catch {
        // Ignora caso não existam provedores
      }

      const formatted = {
        ...this.formatMedia(tv, 'TV'),
        numberOfSeasons: tv.number_of_seasons,
        genres: tv.genres,
        watchProviders: {
          region: 'BR',
          tmdbWatchLink: watchData?.link || null,
          flatrate: (watchData?.flatrate || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          free: (watchData?.free || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          ads: (watchData?.ads || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          rent: (watchData?.rent || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
          buy: (watchData?.buy || []).map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_url: `${this.imageBase}${p.logo_path}`,
          })),
        },
      };

      cache.set(cacheKey, formatted);
      return { data: formatted, fromFallback: false };
    } catch (error) {
      console.error('[TMDB TV Details Error]:', (error as Error).message);
      return { data: null, fromFallback: true };
    }
  }
  
  async getMediaByGenre(genreId: number, page = 1) {
    const cacheKey = `genre_${genreId}_p${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached, fromFallback: false };

    try {
      const res = await this.api.get('/discover/movie', {
        params: { with_genres: genreId, page }
      });
      const results = res.data.results.map((m: any) => this.formatMedia(m, 'MOVIE'));
      const data = {
        results,
        totalPages: Math.min(res.data.total_pages, 500)
      };
      cache.set(cacheKey, data);
      return { data, fromFallback: false };
    } catch (error) {
      console.error('[TMDB Genre Error]:', (error as Error).message);
      return { data: { results: [], totalPages: 1 }, fromFallback: true };
    }
  }
  
  async searchMedia(query: string) {
    const cacheKey = `search_${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached, fromFallback: false };

    try {
      const res = await this.api.get('/search/multi', { params: { query } });
      const results = res.data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => this.formatMedia(item, item.media_type === 'tv' ? 'TV' : 'MOVIE'));

      cache.set(cacheKey, results);
      return { data: results, fromFallback: false };
    } catch (error) {
      console.error('[TMDB Search Error]:', (error as Error).message);
      return { data: [], fromFallback: true };
    }
  }
}

export const tmdbService = new TmdbService();