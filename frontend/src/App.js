import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [pokemonBoosterMap, setPokemonBoosterMap] = useState({});
  const [boosterList, setBoosterList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState("");
  const [boosterOptions, setBoosterOptions] = useState([]);
  const [selectedBooster, setSelectedBooster] = useState("");
  const [filterBooster, setFilterBooster] = useState("");
  const [requester, setRequester] = useState("tim");
  const [tradeResults, setTradeResults] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/pokemon-list").then((res) => {
      setPokemonList(res.data);
    });

    axios.get("http://localhost:5000/api/booster-packs").then((res) => {
      setBoosterList(res.data);
    });

    axios.get("http://localhost:5000/api/pokemon-booster-map").then((res) => {
      setPokemonBoosterMap(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedPokemon && pokemonBoosterMap[selectedPokemon]) {
      setBoosterOptions(pokemonBoosterMap[selectedPokemon]);
    } else {
      setBoosterOptions([]);
    }
    setSelectedBooster(""); // Reset booster pack when Pokémon changes
  }, [selectedPokemon, pokemonBoosterMap]);

  const handleTrade = async () => {
    if (!selectedPokemon || !selectedBooster) {
      alert("Please select a Pokémon and its Booster Pack.");
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/trade-options/${requester}`, {
        pokemon: selectedPokemon,
        booster_pack: selectedBooster,
        filter_booster: filterBooster,
      });
      setTradeResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Something went wrong fetching trade options.");
    }
  };

  return (
    <div
      className="app-container"
      style={{
        background: "linear-gradient(to bottom, #ffdde1, #fbb1bd)",
        minHeight: "100vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1>💖 App for my bby girl 💖</h1>

      <div
        className="trade-form"
        style={{ maxWidth: "500px", margin: "0 auto", padding: "1rem" }}
      >
        <label>👥 Who is requesting:</label>
        <select value={requester} onChange={(e) => setRequester(e.target.value)}>
          <option value="tim">Tim wants to trade</option>
          <option value="rox">Rox wants to trade</option>
        </select>

        <br />
        <br />
        <label>✨ Pokémon to request:</label>
        <select value={selectedPokemon} onChange={(e) => setSelectedPokemon(e.target.value)}>
          <option value="">-- Select a Pokémon --</option>
          {pokemonList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <br />
        <br />
        <label>📦 From Booster Pack:</label>
        <select value={selectedBooster} onChange={(e) => setSelectedBooster(e.target.value)}>
          <option value="">-- Select Booster Pack --</option>
          {boosterOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <br />
        <br />
        <label>🎁 Filter Offers by Booster Pack:</label>
        <select value={filterBooster} onChange={(e) => setFilterBooster(e.target.value)}>
          <option value="">-- No Filter --</option>
          {boosterList.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <br />
        <br />
        <button
          onClick={handleTrade}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            backgroundColor: "#ff69b4",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
          }}
        >
          💌 Show Trade Options
        </button>
      </div>

      {tradeResults.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h2>💘 Suggested Trades:</h2>
          <div
            className="cards"
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
          >
            {tradeResults.map((t, i) => (
              <div
                className="card"
                key={i}
                style={{
                  margin: "1rem",
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "1rem",
                  boxShadow: "0 0 10px #ccc",
                  width: "200px",
                }}
              >
                <img
                  src={t.ImageURL}
                  alt={t.Pokemon}
                  style={{
                    width: "100%",
                    borderRadius: "1rem",
                    objectFit: "cover",
                    height: "200px",
                  }}
                  onError={(e) =>
                    (e.target.src = "http://localhost:5000/images/missingno.jpg")
                  }
                />
                <h3>{t.Pokemon}</h3>
                <p>📦 {t["Booster Pack"]}</p>
                <p>⭐ Rarity: {t.Rarity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;