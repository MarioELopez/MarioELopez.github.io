"""
fetch_strava.py — Obtiene stats de Strava y guarda strava.json
Corre automáticamente via GitHub Actions cada hora.
"""

import os, json, requests
from datetime import datetime, timezone

CLIENT_ID     = os.environ["STRAVA_CLIENT_ID"]
CLIENT_SECRET = os.environ["STRAVA_CLIENT_SECRET"]
REFRESH_TOKEN = os.environ["STRAVA_REFRESH_TOKEN"]
KM_MINIMO     = 60  # Si el año tiene menos de esto, mostrar PR en vez de km anuales

# ── 1. Renovar access token ──────────────────────────────────
res = requests.post("https://www.strava.com/oauth/token", data={
    "client_id":     CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "refresh_token": REFRESH_TOKEN,
    "grant_type":    "refresh_token",
})
res.raise_for_status()
access_token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {access_token}"}

# ── 2. Stats del atleta ──────────────────────────────────────
athlete   = requests.get("https://www.strava.com/api/v3/athlete", headers=headers).json()
stats_url = f"https://www.strava.com/api/v3/athletes/{athlete['id']}/stats"
stats     = requests.get(stats_url, headers=headers).json()

km_anio    = round(stats["ytd_ride_totals"]["distance"] / 1000, 1)
km_alltime = round(stats["all_ride_totals"]["distance"] / 1000, 1)

# ── 3. Última actividad ──────────────────────────────────────
actividades = requests.get(
    "https://www.strava.com/api/v3/athlete/activities",
    headers=headers,
    params={"per_page": 1}
).json()

ultima = {}
if actividades:
    act = actividades[0]
    ultima = {
        "nombre":    act.get("name", ""),
        "distancia": round(act.get("distance", 0) / 1000, 1),
        "tiempo":    act.get("moving_time", 0),
        "fecha":     act.get("start_date_local", "")[:10],
        "velocidad": round(act.get("average_speed", 0) * 3.6, 1),
    }

# ── 4. PR: actividad más larga y más rápida (últimas 200) ────
actividades_200 = requests.get(
    "https://www.strava.com/api/v3/athlete/activities",
    headers=headers,
    params={"per_page": 200}
).json()

pr_distancia = 0
pr_velocidad = 0

for act in actividades_200:
    dist = act.get("distance", 0) / 1000
    vel  = act.get("average_speed", 0) * 3.6
    if dist > pr_distancia:
        pr_distancia = round(dist, 1)
    if vel > pr_velocidad:
        pr_velocidad = round(vel, 1)

# ── 5. Decidir qué mostrar en el botón ──────────────────────
if km_anio >= KM_MINIMO:
    modo    = "anual"
    display = f"{km_anio} km este año"
else:
    modo    = "pr"
    display = f"🏆 {pr_distancia} km · ⚡ {pr_velocidad} km/h"

# ── 6. Guardar JSON ──────────────────────────────────────────
data = {
    "actualizado": datetime.now(timezone.utc).isoformat(),
    "km_anio":      km_anio,
    "km_alltime":   km_alltime,
    "pr_distancia": pr_distancia,
    "pr_velocidad": pr_velocidad,
    "ultima":       ultima,
    "modo":         modo,
    "display":      display,
}

with open("strava.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ strava.json actualizado — modo: {modo} — {display}")
