# Discord Bot — prêt pour Render

Un bot Discord minimal qui expose une commande slash `/ping`.

## 🔧 Pré-requis
- Node.js 18+ (Render l'a déjà)
- Un bot Discord créé dans le **Developer Portal**
- Les variables d’environnement suivantes :
  - `DISCORD_TOKEN` (token du bot)
  - `APPLICATION_ID` (ID de l’application)
  - `GUILD_ID` *(optionnel, recommandé pour dev/test — enregistre la commande immédiatement dans votre serveur)*

## 🚀 Déploiement sur Render (Web Service)
1. Poussez ce dossier sur GitHub.
2. Sur Render, **New** → **Web Service** → connectez votre repo.
3. Paramètres :
   - *Build Command* : `npm install`
   - *Start Command* : `npm start`
4. Dans **Environment**, ajoutez :
   - `DISCORD_TOKEN` = votre token
   - `APPLICATION_ID` = l'ID de l'application (client)
   - `GUILD_ID` = l'ID de votre serveur de test (optionnel)
5. Déployez. Attendez le log : `🤖 Connecté en tant que ...`

> ℹ️ Si vous **n'indiquez pas** `GUILD_ID`, les commandes sont enregistrées en **global** et peuvent prendre jusqu'à **1 heure** pour apparaître dans Discord. Avec `GUILD_ID`, c'est en général **immédiat**.

## 🧪 Tester
Dans votre serveur, tapez `/ping` → le bot répond `🏓 Pong!`.

## 🛠️ Développement en local (optionnel)
- Créez un fichier `.env` en copiant `.env.example` et en remplissant vos valeurs.
- Installez et lancez :
  ```bash
  npm install
  npm start
  ```
- Dans le Developer Portal, assurez-vous que le bot est invité sur votre serveur.

## ❓ FAQ
- **Prime ou AWS ?** AWS Free Tier ≠ Amazon Prime. Prime n'a aucun effet sur AWS.
- **Pourquoi un mini serveur HTTP ?** Les Web Services Render attendent une connexion entrante. Ce serveur minimal renvoie simplement `200 OK` pour rester "healthy".
- **Je ne vois pas /ping** : vérifiez `GUILD_ID` (pour enregistrement rapide) ou patientez jusqu'à 1h pour les commandes globales.
