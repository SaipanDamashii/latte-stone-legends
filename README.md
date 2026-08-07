# Latte Stone Legends

**A tropical strategy card game inspired by the people, places, wildlife, legends, and cultural heritage of the Mariana Islands.**

Latte Stone Legends is a browser-based card game built with [Phaser](https://phaser.io/). Players compete for control of a 3×3 board by placing cards whose numbered sides can capture adjacent opposing cards. Victory requires careful positioning, tactical use of each card’s strengths, and a little island fighting spirit.

The game draws visual and thematic inspiration from the Commonwealth of the Northern Mariana Islands (CNMI), transforming familiar landscapes, native wildlife, cultural figures, historical sites, and traditional legends into collectible cards.

## Gameplay

Each card has four values representing its strength on the top, right, bottom, and left sides.

1. Players take turns placing one card into an open space on the 3×3 board.
2. When a newly placed card touches an opponent’s card, the values on the adjoining sides are compared.
3. If the placed card’s value is higher, the opposing card is captured and changes allegiance.
4. The match ends when all nine spaces have been filled.
5. The player who controls the most cards wins.

Simple rules make the game easy to learn, while card selection, board position, and directional strengths create deeper strategic possibilities.

## Features

- Fast, turn-based matches on a 3×3 board
- Directional card values and tactical capture mechanics
- Computer-controlled opponent
- Collectible cards with multiple rarity and power levels
- Deck and card-collection progression
- Persistent save data in supported browsers
- Original CNMI-inspired artwork, characters, locations, and legends
- Tropical presentation created specifically for *Latte Stone Legends*

## The World of Latte Stone Legends

The card collection celebrates the Marianas through subjects such as:

- Latte stones and ancient Chamorro heritage
- Carolinian navigation and island traditions
- Saipan, Tinian, Rota, and the surrounding Marianas
- Native and locally significant wildlife
- Historic landmarks and natural wonders
- Chamorro and Carolinian legends, spirits, healers, chiefs, and cultural figures

Latte Stone Legends is a fantasy game inspired by the Marianas. It is not intended to serve as an authoritative source on the history, beliefs, or cultures represented. Cultural subjects should be approached with respect, and the game may continue to evolve as its content is reviewed and expanded.

## Built With

- JavaScript
- HTML5 and CSS
- [Phaser](https://phaser.io/)
- Browser-based local storage for saved progress

## Playing the Game

Open the published game page in a modern desktop or mobile browser. From the main menu, select **Play**, choose or prepare your cards when prompted, and place cards onto open spaces on the board during your turn.

For the best experience, enable audio and allow the browser to retain site data so that unlocked cards and other progress can be saved.

## Running Locally

Because browsers may restrict assets loaded directly from the filesystem, run the project through a local web server instead of opening `index.html` directly.

For example, if Python is installed:

```bash
python -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

Depending on the final project structure, additional setup may be required. Consult the repository files and package configuration for the current development commands.

## Development Status

Latte Stone Legends is an evolving independent game project. Gameplay, card balance, artwork, features, and interface elements may change as development continues.

Bug reports and constructive feedback are welcome through the repository’s Issues section.

## Cultural Note

The latte stone is one of the most recognizable symbols of Chamorro history and identity. The name *Latte Stone Legends* reflects the game’s goal of celebrating the stories, environments, and cultural character of the Mariana Islands through an accessible strategy-card format.

## Credits

Created by **Kelvin Rodeo / KAOZ Theory**.

Special appreciation goes to the communities of the Mariana Islands whose history, culture, landscapes, stories, and resilience inspired this project.

Special appreciation also goes to Takayoshi Nakazato, the designer of the Triple Triad minigame in Final Fantasy VIII, which Latte Stone Legends is based on.

## License

All original game code, artwork, characters, card designs, writing, music, and other assets remain the property of their respective creator or copyright holder unless otherwise stated.

This repository is not automatically licensed for copying, redistribution, modification, or commercial use. A separate license may be added in the future.

---

*Håfa Adai and welcome to Latte Stone Legends.*
