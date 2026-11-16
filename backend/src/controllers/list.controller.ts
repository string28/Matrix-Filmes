import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

const saveItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(['MOVIE', 'TV']).default('MOVIE'),
  listType: z.enum(['FAVORITE', 'WATCH_LATER']),
  title: z.string().min(1),
  posterPath: z.string().nullable().optional(),
  posterUrl: z.string().nullable().optional(), // Aceita também posterUrl
  voteAverage: z.number().optional(),
  releaseYear: z.string().optional(),
});

export class ListController {
  static async getUserLists(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const items = await prisma.savedMedia.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formatWithUrl = (item: any) => ({
      ...item,
      // Se já tiver o URL completo gravado usa-o, senão reconstrói a partir do posterPath
      posterUrl: item.posterPath && item.posterPath.startsWith('http') 
        ? item.posterPath 
        : item.posterPath 
          ? `https://image.tmdb.org/t/p/w500${item.posterPath}` 
          : null,
    });

    return res.json({
      favorites: items.filter((i) => i.listType === 'FAVORITE').map(formatWithUrl),
      watchLater: items.filter((i) => i.listType === 'WATCH_LATER').map(formatWithUrl),
    });
  }

  static async toggleItem(req: AuthRequest, res: Response) {
    const parsed = saveItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parâmetros inválidos para salvar na lista.' });
    }

    const userId = req.userId!;
    const { tmdbId, mediaType, listType, title, posterPath, posterUrl, voteAverage, releaseYear } = parsed.data;

    // Extrai apenas o caminho relativo se vier um URL completo (ex: /abc123.jpg)
    let finalPosterPath = posterPath || posterUrl || null;
    if (finalPosterPath && finalPosterPath.includes('image.tmdb.org')) {
      finalPosterPath = finalPosterPath.replace('https://image.tmdb.org/t/p/w500', '');
    }

    const existing = await prisma.savedMedia.findUnique({
      where: {
        userId_tmdbId_mediaType_listType: { userId, tmdbId, mediaType, listType },
      },
    });

    if (existing) {
      await prisma.savedMedia.delete({ where: { id: existing.id } });
      return res.json({ status: 'REMOVED', listType, tmdbId });
    }

    const created = await prisma.savedMedia.create({
      data: { 
        userId, 
        tmdbId, 
        mediaType, 
        listType, 
        title, 
        posterPath: finalPosterPath, 
        voteAverage, 
        releaseYear 
      },
    });

    return res.status(201).json({ status: 'ADDED', item: created });
  }
}