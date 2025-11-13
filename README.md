<p align="center">
   <img src="https://github.com/zeke-code/OnigiriBot/assets/116798879/1c868e6c-dcb2-43e2-a3f7-01428f187fc9" width="400" height="400">
</p>

<h1 align="center">OnigiriBot - A Lightweight, Simple, Versatile Discord Bot</h1>

<p align="center">
  <a href="#overview">Overview</a> • 
  <a href="#installation">Installation</a> • 
</p>

# Overview

OnigiriBot is a simple and lightweight Discord bot that can moderate your Discord server, play music, and more.

# Installation

OnigiriBot has two types of installation:

- [Docker](#docker-installation)
- [Manual](#manual-installation)

Follow the installation method you prefer by reading the relative section in this document.

## Docker Installation

To follow this installation method, you must have [**Docker**](https://www.docker.com/) installed on your machine.

### Step 1: Registering the bot on Discord and retrieving bot's token

1. **Create Your Bot**:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and login with your Discord account.
   - Click on “New Application”, give it a name (like OnigiriBot), and create your application. (If you don't have a profile picture to use, feel free to download the one at the top of this document)

2. **Get Your Bot Token and Application ID**:
   - Under the "General Information" section, you'll find your application ID. Copy and save it somewhere.
   - Under the “Bot” section, you’ll find your bot’s token. Copy and save this token somewhere safe, as you'll need it for your bot's configuration.
     Note that anyone in possess of this token can run whatever code they want using your bot tied to your Discord account.

3. **Enable Bot's Privileged Gateway Intents**:
   - Under the "Bot" section, enable all privileged gateway intents, as OnigiriBot requires them to run properly.

### Step 2: cloning the repository and configuration

Clone the OnigiriBot repository through this command:

```sh
git clone https://github.com/zeke-code/OnigiriBot.git
```

Create a `.env` file and place it in the root folder.
Open the `.env` file with any kind of text editor and add the following lines to the `.env` file, replacing `YOUR_BOT_TOKEN` and `YOUR_APPLICATION_ID` with the token and application ID you obtained from the Discord Developer Portal:

```env
DISCORD_TOKEN=<YOUR_BOT_TOKEN>
APPLICATION_ID=<YOUR_APPLICATION_ID>
```

Save the file.

### Step 3: startup

Ensure the Docker daemon is up and running. On the terminal, while inside OnigiriBot's folder, type:

```sh
docker compose up
```

This will startup OnigiriBot. If configuration was successful, you'll see a message similiar to the following:

```sh
info: Started refreshing 15 application (/) commands. {"service":"OnigiriBot","timestamp":"2024-09-12 00:00:00"}
info: Successfully reloaded 15 application (/) commands. {"service":"OnigiriBot","timestamp":"2024-09-12 00:00:03"}
Ready! Logged in as OnigiriBot#3212
```

Now, to add OnigiriBot to your private Discord server, follow **["Adding OnigiriBot to your server"]**(#adding-onigiribot-to-your-server) section of this document.

## Manual Installation

To install the bot locally without Docker, ensure that you meet the following prerequisites:

- **Node.js**: OnigiriBot requires Node.js to run. You can download it from [Node.js Official Website](https://nodejs.org/). It's recommended to use the **LTS** version. Just open the installer you downloaded and follow the installation guide.
- **FFMPEG**: This is required for handling media streams, it's a **must** if your bot will play music or handle audio. You can download FFMPEG from the [FFMPEG Official Website](https://ffmpeg.org/download.html), or if you're on a Unix machine, you can probably use a package manager to handle this for you.

### Step 1: Registering the bot on Discord and retrieving bot's token

1. **Create Your Bot**:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and login with your Discord account.
   - Click on “New Application”, give it a name (like OnigiriBot), and create your application. (If you don't have a profile picture to use, feel free to download the one at the top of this document)

2. **Get Your Bot Token and Application ID**:
   - Under the "General Information" section, you'll find your application ID. Copy and save it somewhere.
   - Under the “Bot” section, you’ll find your bot’s token. Copy and save this token somewhere safe, as you'll need it for your bot's configuration and login.
     Note that anyone in possess of this token can run whatever code they want using your bot tied to your Discord account.

3. **Enable Bot's Privileged Gateway Intents**:
   - Under the "Bot" section, enable all privileged gateway intents, as OnigiriBot requires them to run properly.

### Step 2: Cloning the repository, installing dependencies, configuration

Clone the OnigiriBot repository to your local machine using through a terminal:

```sh
git clone https://github.com/zeke-code/OnigiriBot.git
```

Install dependencies of the project by navigating inside the freshly cloned repository and typing:

```sh
npm install
```

Create a `.env` file and place it in the root folder.
Open the `.env` file with any kind of text editor and add the following lines to the `.env` file, replacing `YOUR_BOT_TOKEN` and `YOUR_APPLICATION_ID` with the token and application ID you obtained from the Discord Developer Portal:

```env
DISCORD_TOKEN=<YOUR_BOT_TOKEN>
APPLICATION_ID=<YOUR_APPLICATION_ID>
```

Save the file.

### Step 3: Running OnigiriBot

Open a terminal inside the root directory, and use the following command:

```sh
npm run start
```

If everything is set up correctly, OnigiriBot should now be running. On the console, you should see something like this:

```console
$ npm run start
info: Started refreshing 15 application (/) commands. {"service":"OnigiriBot","timestamp":"2024-09-12 00:00:00"}
info: Successfully reloaded 15 application (/) commands. {"service":"OnigiriBot","timestamp":"2024-09-12 00:00:03"}
Ready! Logged in as OnigiriBot#3212
```

Now, to add OnigiriBot to your private Discord server, follow **["Adding OnigiriBot to your server"]**(#adding-onigiribot-to-your-server) section of this document.

## Adding OnigiriBot to Your Server

To add OnigiriBot to your server, create an invite link:

- Go back to the Discord Developer Portal, navigate to the “OAuth2” tab.
- Under “Scopes”, select “bot”.
- Under “Bot Permissions”, select the permissions you want to give the bot.
- Use the generated URL to invite OnigiriBot to your server by accessing the URL on your browser.

## Notes

If you encounter any issues, feel free to open an issue on the GitHub repository.

**Disclaimer: The developer of this bot assumes no responsibility or liability for any actions taken by users of this bot. This bot is intended solely for instructive and demonstrative purposes. Users are responsible for ensuring that their use complies with all applicable laws and regulations.**
