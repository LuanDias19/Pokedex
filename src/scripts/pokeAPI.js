const pokeApi = {};

// Função que converte os dados detalhados (incluindo dados de espécie)
function convertPokeApiDetailToPokemon(pokeDetail, speciesDetail) {
  const pokemon = new Pokemon();
  pokemon.number = pokeDetail.id;
  pokemon.name = pokeDetail.name;

  const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name);
  const [type] = types;

  pokemon.types = types;
  pokemon.type = type;

  // Prioriza o artwork oficial que é mais bonito
  pokemon.photo =
    pokeDetail.sprites.other["official-artwork"].front_default ||
    pokeDetail.sprites.other.dream_world.front_default;

  // --- Novos Dados Detalhados ---
  // Altura e Peso: PokéAPI usa decimetros e hectogramas. Convertemos para metros e kg.
  pokemon.height = (pokeDetail.height * 0.1).toFixed(1);
  pokemon.weight = (pokeDetail.weight * 0.1).toFixed(1);

  // Habilidades
  pokemon.abilities = pokeDetail.abilities
    .map((a) => a.ability.name)
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(", ");

  // Dados da Espécie
  const genusEntry = speciesDetail.genera.find((g) => g.language.name === "en");
  pokemon.species = genusEntry
    ? genusEntry.genus.replace(" Pokémon", "")
    : "Unknown";

  pokemon.genderRate = speciesDetail.gender_rate; // 0 a 8
  pokemon.eggGroups = speciesDetail.egg_groups
    .map((e) => e.name)
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(", ");
  pokemon.eggCycle = pokemon.eggGroups.split(", ")[0] || "Unknown";

  return pokemon;
}

// Nova função para buscar todos os detalhes de um único Pokémon por ID
pokeApi.getPokemonFullDetails = (id) => {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  // Faz requisição para os dados básicos e de espécie em paralelo
  return Promise.all([
    fetch(url).then((res) => res.json()),
    fetch(speciesUrl).then((res) => res.json()),
  ])
    .then(([pokeDetail, speciesDetail]) => {
      return convertPokeApiDetailToPokemon(pokeDetail, speciesDetail);
    })
    .catch((error) => {
      console.error("Erro ao buscar detalhes completos da API:", error);
      throw error;
    });
};

// Mantém a função original para carregar a lista (usa apenas dados básicos)
pokeApi.getPokemonDetail = (pokemon) => {
  return fetch(pokemon.url)
    .then((response) => response.json())
    .then((pokeDetail) => {
      const p = new Pokemon();
      p.number = pokeDetail.id;
      p.name = pokeDetail.name;
      p.types = pokeDetail.types.map((typeSlot) => typeSlot.type.name);
      p.type = p.types[0];
      p.photo = pokeDetail.sprites.other.dream_world.front_default;
      return p;
    });
};

pokeApi.getPokemons = (offset = 0, limit = 5) => {
  const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;

  return fetch(url)
    .then((response) => response.json())
    .then((jsonBody) => jsonBody.results)
    .then((pokemons) => pokemons.map(pokeApi.getPokemonDetail))
    .then((detailRequests) => Promise.all(detailRequests))
    .then((pokemonsDetails) => pokemonsDetails);
};

// Função auxiliar para mapear a cadeia de evolução recursivamente
function getEvolutionSteps(chain) {
  const evolutions = [];

  // Processa a primeira forma (a base)
  let current = chain.species.name;
  let nextSteps = chain.evolves_to;

  // Função interna para recursão
  function processEvolvesTo(step, fromName) {
    // Pega o nome do Pokémon atual no passo
    const currentName = step.species.name;
    const evolutionDetails = step.evolution_details[0] || {};

    evolutions.push({
      from: fromName,
      to: currentName,
      details: evolutionDetails,
    });

    // Se houver mais evoluções, chama recursivamente
    step.evolves_to.forEach((nextStep) => {
      processEvolvesTo(nextStep, currentName);
    });
  }

  // Processa as primeiras evoluções
  nextSteps.forEach((nextStep) => {
    processEvolvesTo(nextStep, current);
  });

  // Retorna a lista de objetos de evolução
  return evolutions;
}

pokeApi.getPokemonEvolutions = (id) => {
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}/`;

  return fetch(speciesUrl)
    .then((response) => response.json())
    .then((speciesData) => {
      const evolutionChainUrl = speciesData.evolution_chain.url;
      return fetch(evolutionChainUrl); // 3. Busca a Evolution Chain
    })
    .then((response) => response.json())
    .then((evolutionChainData) => {
      // 4. Mapeia a cadeia de evolução para um formato simples
      return getEvolutionSteps(evolutionChainData.chain);
    })
    .catch((error) => {
      console.error("Erro ao buscar cadeia de evolução:", error);
      return []; // Retorna array vazio em caso de erro
    });
};
