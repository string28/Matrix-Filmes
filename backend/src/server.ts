import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tmdbService } from './services/tmdb.service';
import { AuthController } from './controllers/auth.controller';
import { ListController } from './controllers/list.controller';
import { authMiddleware } from './middlewares/auth.middleware';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

// Rotas de Autenticação
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/me', authMiddleware, AuthController.me);

app.get('/api/catalog/genre/:genreId', async (req, res) => {
  const genreId = Number(req.params.genreId);
  const page = Number(req.query.page) || 1;
  const result = await tmdbService.getMediaByGenre(genreId, page);
  return res.json(result);
});

// Rotas de Catálogo
app.get('/api/catalog/home', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const result = await tmdbService.getHomeCatalog(page);
  return res.json(result);
});

// Detalhes de Filme (com fornecedores de streaming)
app.get('/api/catalog/movie/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await tmdbService.getMovieDetails(id);
  return res.json(result);
});

// Detalhes de Série (com fornecedores de streaming)
app.get('/api/catalog/tv/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await tmdbService.getTvDetails(id);
  return res.json(result);
});

// Pesquisa Global de Filmes e Séries
app.get('/api/catalog/search', async (req, res) => {
  const query = String(req.query.query || '');
  const result = await tmdbService.searchMedia(query);
  return res.json(result);
});

// Rotas de Listas do Utilizador
app.get('/api/lists', authMiddleware, ListController.getUserLists);
app.post('/api/lists/toggle', authMiddleware, ListController.toggleItem);

const PORT = process.env.PORT || 3333;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Matrix Filmes API] Rodando na porta ${PORT}`);
  });
}