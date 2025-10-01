const pokemonList = document.getElementById("pokemonList");
const loadMoreButton = document.getElementById("loadMoreButton");

const maxRecords = 151;
const limit = 10;
let offset = 0;

function convertPokemonToLi(pokemon) {
  // O <li> agora tem o data-id e não tem mais a tag <a> externa
  return `
    <li class="pokemon ${pokemon.type}" data-id="${pokemon.number}"> 
        <span class="number">#${pokemon.number
          .toString()
          .padStart(3, "0")}</span>
        <span class="name">${pokemon.name}</span>

        <div class="detail">
            <ol class="types">
                ${pokemon.types
                  .map((type) => `<li class="type ${type}">${type}</li>`)
                  .join("")}
            </ol>

            <img src="${pokemon.photo}"
                 alt="${pokemon.name}">
        </div>
    </li>
    `;
}

// Nova lógica de redirecionamento
function addPokemonCardListeners() {
  document.querySelectorAll(".pokemon").forEach((card) => {
    // Remove listener duplicado, se houver
    card.removeEventListener("click", handlePokemonCardClick);
    // Adiciona o novo listener
    card.addEventListener("click", handlePokemonCardClick);
  });
}

function handlePokemonCardClick(event) {
  const pokemonId = event.currentTarget.dataset.id;
  // REDIRECIONA PARA especifico.html PASSANDO O ID NA QUERY STRING
  window.location.href = `./especifico.html?id=${pokemonId}`;
}

function loadPokemonItens(offset, limit) {
  pokeApi.getPokemons(offset, limit).then((pokemons = []) => {
    const newHtml = pokemons.map(convertPokemonToLi).join("");
    pokemonList.innerHTML += newHtml;
    // Adiciona o listener APÓS a inserção dos novos itens no DOM
    addPokemonCardListeners();
  });
}

loadPokemonItens(offset, limit);

loadMoreButton.addEventListener("click", () => {
  offset += limit;
  const qtdRecordsWithNexPage = offset + limit;

  if (qtdRecordsWithNexPage >= maxRecords) {
    const newLimit = maxRecords - offset;
    loadPokemonItens(offset, newLimit);

    loadMoreButton.parentElement.removeChild(loadMoreButton);
  } else {
    loadPokemonItens(offset, limit);
  }
});
