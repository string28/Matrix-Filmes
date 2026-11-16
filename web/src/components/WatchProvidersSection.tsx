import React from 'react';

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_url: string;
}

interface WatchProvidersProps {
  providers: {
    region: string;
    tmdbWatchLink: string | null;
    flatrate: Provider[];
    free: Provider[];
    ads: Provider[];
    rent: Provider[];
    buy: Provider[];
  };
  movieTitle: string;
}

export function WatchProvidersSection({ providers, movieTitle }: WatchProvidersProps) {
  const hasProviders = 
    providers?.flatrate?.length > 0 || 
    providers?.free?.length > 0 || 
    providers?.ads?.length > 0 || 
    providers?.rent?.length > 0 || 
    providers?.buy?.length > 0;

  if (!providers || !hasProviders) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-[#090A0F] border border-slate-800 text-slate-400 text-xs">
        Sem opções de streaming disponíveis no Brasil para este título no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-slate-800">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Onde Assistir (Brasil) - Clica para abrir</h3>
      
      {/* Streaming / Subscrição */}
      {providers.flatrate && providers.flatrate.length > 0 && (
        <div>
          <span className="text-xs text-cyan-400 block mb-2 font-semibold">Streaming (Subscrição)</span>
          <div className="flex flex-wrap gap-3">
            {providers.flatrate.map((provider) => (
              <ProviderBadge key={provider.provider_id} provider={provider} movieTitle={movieTitle} />
            ))}
          </div>
        </div>
      )}

      {/* Grátis */}
      {providers.free && providers.free.length > 0 && (
        <div>
          <span className="text-xs text-emerald-400 block mb-2 font-semibold">Gratuito</span>
          <div className="flex flex-wrap gap-3">
            {providers.free.map((provider) => (
              <ProviderBadge key={provider.provider_id} provider={provider} movieTitle={movieTitle} />
            ))}
          </div>
        </div>
      )}

      {/* Com Anúncios */}
      {providers.ads && providers.ads.length > 0 && (
        <div>
          <span className="text-xs text-amber-400 block mb-2 font-semibold">Com Anúncios / Grátis</span>
          <div className="flex flex-wrap gap-3">
            {providers.ads.map((provider) => (
              <ProviderBadge key={provider.provider_id} provider={provider} movieTitle={movieTitle} />
            ))}
          </div>
        </div>
      )}

      {/* Aluguer */}
      {providers.rent && providers.rent.length > 0 && (
        <div>
          <span className="text-xs text-slate-400 block mb-2 font-medium">Alugar</span>
          <div className="flex flex-wrap gap-3">
            {providers.rent.map((provider) => (
              <ProviderBadge key={provider.provider_id} provider={provider} movieTitle={movieTitle} />
            ))}
          </div>
        </div>
      )}

      {/* Compra */}
      {providers.buy && providers.buy.length > 0 && (
        <div>
          <span className="text-xs text-slate-400 block mb-2 font-medium">Comprar</span>
          <div className="flex flex-wrap gap-3">
            {providers.buy.map((provider) => (
              <ProviderBadge key={provider.provider_id} provider={provider} movieTitle={movieTitle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getProviderSearchUrl(providerName: string, title: string) {
  const query = encodeURIComponent(title);
  const name = providerName.toLowerCase();
  
  if (name.includes('netflix')) return `https://www.netflix.com/search?q=${query}`;
  if (name.includes('prime') || name.includes('amazon')) return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${query}`;
  if (name.includes('disney')) return `https://www.disneyplus.com/search/${query}`;
  if (name.includes('max') || name.includes('hbo')) return `https://play.max.com/search?q=${query}`;
  if (name.includes('globoplay')) return `https://globoplay.globo.com/busca/?q=${query}`;
  if (name.includes('apple')) return `https://tv.apple.com/br/search?term=${query}`;
  if (name.includes('crunchyroll')) return `https://www.crunchyroll.com/search?q=${query}`;
  if (name.includes('paramount')) return `https://www.paramountplus.com/br/search/?q=${query}`;
  
  // Fallback inteligente para pesquisa direta no Google se a plataforma for específica
  return `https://www.google.com/search?q=assistir+${query}+no+${encodeURIComponent(providerName)}`;
}

function ProviderBadge({ provider, movieTitle }: { provider: Provider; movieTitle: string }) {
  const targetUrl = getProviderSearchUrl(provider.provider_name, movieTitle);

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 bg-[#121521] border border-violet-500/30 hover:border-cyan-400 px-3.5 py-2 rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer group"
      title={`Procurar em ${provider.provider_name}`}
    >
      <img src={provider.logo_url} alt={provider.provider_name} className="w-6 h-6 rounded-lg object-cover" />
      <span className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors">{provider.provider_name} ↗</span>
    </a>
  );
}