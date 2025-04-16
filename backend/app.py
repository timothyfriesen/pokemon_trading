from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask import send_file
import pandas as pd
import json
import os

app = Flask(__name__)
CORS(app)

# Load Pokémon image mapping if needed in future
with open("pokemon_image_map.json", "r", encoding="utf-8") as f:
    image_map = json.load(f)

# Load ownership data
df_tim = pd.read_excel("Pokemons.xlsx", sheet_name="Tim", skiprows=2, usecols="B,C,D,F")
df_rox = pd.read_excel("Pokemons.xlsx", sheet_name="Rox", skiprows=2, usecols="B,C,D,F")

df_tim = df_tim[df_tim["Do u have it"] == True].rename(columns={"Do u have it": "Has"})
df_rox = df_rox[df_rox["Do u have it"] == True].rename(columns={"Do u have it": "Has"})

df_tim = df_tim[["Pokemon", "Booster Pack", "Rarity"]].reset_index(drop=True)
df_rox = df_rox[["Pokemon", "Booster Pack", "Rarity"]].reset_index(drop=True)
df_all = pd.concat([df_tim, df_rox], ignore_index=True)

# --- API ROUTES ---

@app.route("/api/pokemon-list")
def pokemon_list():
    all_pokemon = sorted(set(df_all["Pokemon"].tolist()))
    return jsonify(all_pokemon)

@app.route("/api/booster-packs")
def booster_packs():
    all_packs = sorted(set(df_all["Booster Pack"].tolist()))
    return jsonify(all_packs)

@app.route("/api/pokemon-booster-map")
def pokemon_booster_map():
    booster_map = {}
    for _, row in df_all.iterrows():
        poke = row["Pokemon"]
        pack = row["Booster Pack"]
        booster_map.setdefault(poke, [])
        if pack not in booster_map[poke]:
            booster_map[poke].append(pack)
    return jsonify(booster_map)

@app.route("/api/trade-options/tim", methods=["POST"])
def tim_trade():
    data = request.get_json()
    target = data["pokemon"].strip().lower()
    pack = data["booster_pack"].strip().lower()
    filter_pack = data.get("filter_booster", "").strip().lower()

    rox_match = df_rox[
        (df_rox["Pokemon"].str.lower() == target) &
        (df_rox["Booster Pack"].str.lower() == pack)
    ]
    if rox_match.empty:
        return jsonify([])

    rarity = rox_match["Rarity"].values[0]
    candidates = df_tim[df_tim["Rarity"] == rarity]  # Tim's cards of same rarity
    rox_owned = df_rox["Pokemon"].str.lower().unique()
    options_for_rox = candidates[~candidates["Pokemon"].str.lower().isin(rox_owned)]

    if filter_pack:
        options_for_rox = options_for_rox[options_for_rox["Booster Pack"].str.lower() == filter_pack]

    options_for_rox = options_for_rox.copy()
    options_for_rox["ImageURL"] = options_for_rox["Pokemon"].apply(
        lambda x: f"http://localhost:5000/images/{x.lower()}.jpg"
    )

    return jsonify(options_for_rox.to_dict(orient="records"))

@app.route("/api/trade-options/rox", methods=["POST"])
def rox_trade():
    data = request.get_json()
    target = data["pokemon"].strip().lower()
    pack = data["booster_pack"].strip().lower()
    filter_pack = data.get("filter_booster", "").strip().lower()

    tim_match = df_tim[
        (df_tim["Pokemon"].str.lower() == target) &
        (df_tim["Booster Pack"].str.lower() == pack)
    ]
    if tim_match.empty:
        return jsonify([])

    rarity = tim_match["Rarity"].values[0]
    candidates = df_rox[df_rox["Rarity"] == rarity]  # Rox's cards of same rarity
    tim_owned = df_tim["Pokemon"].str.lower().unique()
    options_for_tim = candidates[~candidates["Pokemon"].str.lower().isin(tim_owned)]

    if filter_pack:
        options_for_tim = options_for_tim[options_for_tim["Booster Pack"].str.lower() == filter_pack]

    options_for_tim = options_for_tim.copy()
    options_for_tim["ImageURL"] = options_for_tim["Pokemon"].apply(
        lambda x: f"http://localhost:5000/images/{x.lower()}.jpg"
    )

    return jsonify(options_for_tim.to_dict(orient="records"))

@app.route('/images/<pokemon_name>.jpg')
def serve_image(pokemon_name):
    # Capitalize the name to match your folder structure (e.g., "Abra")
    folder_name = pokemon_name.capitalize()
    image_path = os.path.join("images", folder_name, "0.jpg")

    if os.path.exists(image_path):
        return send_file(image_path, mimetype='image/jpeg')
    else:
        # Path to your default fallback image
        return send_file(os.path.join("images", "missingno.jpg"), mimetype='image/jpeg')

# Run server
if __name__ == "__main__":
    app.run(debug=True)