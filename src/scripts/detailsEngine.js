// detailsEngine.js - NOVO ARQUIVO

// --- Variáveis do DOM ---
const detailsScreen = document.getElementById("detailsScreen");
const tabsNav = document.querySelectorAll(".tabs-nav .tab-item");
const tabContents = document.querySelectorAll(".tab-content");

// Mapeamento de cores de tipo (para preencher o CSS dinamicamente)
const typeColors = {
  normal: "#a6a877",
  grass: "#77c850",
  fire: "#ee7f30",
  water: "#678fee",
  electric: "#f7cf2e",
  ice: "#98d5d7",
  ground: "#dfbf69",
  flying: "#a98ff0",
  poison: "#a040a0",
  fighting: "#bf3029",
  psychic: "#f65687",
  dark: "#725847",
  rock: "#b8a137",
  bug: "#a8b720",
  ghost: "#6e5896",
  steel: "#b9b7cf",
  dragon: "#6f38f6",
  fairy: "#f9aec7",
};

// --- Funções Auxiliares ---

function calculateGender(genderRate) {
  if (genderRate === -1) {
    return { male: "Genderless", female: "" };
  }
  const femalePercentage = genderRate * 12.5;
  const malePercentage = 100 - femalePercentage;
  return {
    male: `♂ ${malePercentage.toFixed(1)}%`,
    female: `♀ ${femalePercentage.toFixed(1)}%`,
  };
}

function fillDetailsScreen(pokemon) {
  const mainColor = typeColors[pokemon.type] || "#6c79db";

  // 1. Aplica a cor de fundo e a variável CSS
  detailsScreen.style.backgroundColor = mainColor;
  document.documentElement.style.setProperty("--main-color", mainColor);

  // 2. Preenche Header
  document.getElementById("detailsName").textContent =
    pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  document.getElementById("detailsNumber").textContent = `#${pokemon.number
    .toString()
    .padStart(3, "0")}`;
  document.getElementById("detailsImage").src = pokemon.photo;

  // 3. Tipos (Badges)
  const typesContainer = document.getElementById("detailsTypes");
  typesContainer.innerHTML = pokemon.types
    .map(
      (type) =>
        `<span class="type ${type}" style="background-color: ${
          typeColors[type] || "gray"
        };">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`
    )
    .join("");

  // 4. Preenche Aba About
  document.getElementById("detailsSpecies").textContent = pokemon.species;
  document.getElementById("detailsHeight").textContent = `${pokemon.height} m`;
  document.getElementById("detailsWeight").textContent = `${pokemon.weight} kg`;
  document.getElementById("detailsAbilities").textContent = pokemon.abilities;

  // 5. Preenche Aba Breeding
  const gender = calculateGender(pokemon.genderRate);
  document.getElementById("detailsGenderMale").textContent = gender.male;
  document.getElementById("detailsGenderFemale").textContent = gender.female;
  document.getElementById("detailsEggGroups").textContent = pokemon.eggGroups;
  document.getElementById("detailsEggCycle").textContent = pokemon.eggCycle;
}

// --- Lógica Principal: Ler URL e Carregar Dados ---

function getPokemonIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id"); // Pega o valor do parâmetro 'id'
}

function initDetailsPage() {
  const pokemonId = getPokemonIdFromUrl();

  if (pokemonId) {
    // --- 1. Busca os dados de detalhes ---
    const detailsPromise = pokeApi.getPokemonFullDetails(pokemonId);

    // --- 2. Busca os dados de evolução ---
    const evolutionPromise = pokeApi.getPokemonEvolutions(pokemonId); // <--- NOVA CHAMADA

    Promise.all([detailsPromise, evolutionPromise])
      .then(([pokemonData, evolutionData]) => {
        // Preenche os detalhes (About, Breeding)
        fillDetailsScreen(pokemonData);

        // Preenche a aba Evolution
        fillEvolutionTab(evolutionData, pokemonData.name); // <--- NOVA FUNÇÃO
      })
      .catch((error) => {
        console.error("Erro ao carregar a página de detalhes:", error);
        document.getElementById("detailsName").textContent =
          "Erro ao carregar dados do Pokémon.";
      });
  } else {
    document.getElementById("detailsName").textContent =
      "Pokémon não especificado.";
  }
}

// --- Lógica de Navegação das Abas ---

tabsNav.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetTab = tab.dataset.tab;

    // 1. Remove 'active' de todos os itens de navegação
    tabsNav.forEach((item) => item.classList.remove("active"));

    // 2. Adiciona 'active' no item clicado
    tab.classList.add("active");

    // 3. Esconde todos os conteúdos das abas
    tabContents.forEach((content) => content.classList.remove("active"));

    // 4. Mostra o conteúdo da aba correspondente
    document.getElementById(`tab-${targetTab}`).classList.add("active");
  });
});

function fillEvolutionTab(evolutionData, currentPokemonName) {
  const evolutionTab = document.getElementById("tab-evolution");

  if (!evolutionData || evolutionData.length === 0) {
    evolutionTab.innerHTML = `<p>Este Pokémon não possui evolução ou o estágio de evolução é desconhecido.</p>`;
    return;
  }

  let evolutionHtml = "";

  // Mapeia os passos de evolução
  evolutionData.forEach((step) => {
    const fromName = step.from.charAt(0).toUpperCase() + step.from.slice(1);
    const toName = step.to.charAt(0).toUpperCase() + step.to.slice(1);
    const details = step.details;
    let trigger = "Level Up"; // Trigger padrão
    let requirement = "";

    // Determina o requisito de evolução
    if (details.trigger && details.trigger.name !== "level-up") {
      trigger = details.trigger.name.replace("-", " ").toUpperCase();
    } else if (details.item) {
      trigger = "Item";
      requirement = details.item.name.replace("-", " ");
    } else if (details.min_level) {
      requirement = `Level ${details.min_level}`;
    } else if (details.min_happiness) {
      requirement = `Happiness ${details.min_happiness}`;
    } else if (details.held_item) {
      requirement = `Holding ${details.held_item.name.replace("-", " ")}`;
    }

    // HTML para cada passo de evolução
    evolutionHtml += `
            <div class="evolution-step">
                <div class="evolution-names">
                    <span class="evo-from ${
                      step.from === currentPokemonName.toLowerCase()
                        ? "current-poke"
                        : ""
                    }">${fromName}</span> 
                    <span class="arrow">→</span>
                    <span class="evo-to">${toName}</span>
                </div>
                <div class="evolution-requirement">
                    (Trigger: ${trigger}) - ${
      requirement.charAt(0).toUpperCase() + requirement.slice(1)
    }
                </div>
            </div>
            <hr>
        `;
  });

  evolutionTab.innerHTML = `
        <h3 class="section-title">Evolution Path</h3>
        ${evolutionHtml}
    `;
}

// Executa a lógica ao carregar a página
initDetailsPage();
