Place your global button sound file in this folder.

Current configured sound path:
- /sounds/button-click.mp3
- /sounds/cards/draw.mp3 (card draw effect)
- /sounds/result/lose-blackjack.mp3 (lose by dealer blackjack)

So the file should be:
- frontend/public/sounds/button-click.mp3
- frontend/public/sounds/cards/draw.mp3
- frontend/public/sounds/result/lose-blackjack.mp3

If you want to use another filename or extension, update BUTTON_SOUND_SRC in:
- frontend/src/components/ButtonSoundProvider.tsx

If you want to use another filename or extension for card draw, update CARD_DRAW_SOUND_SRC in:
- frontend/src/app/play/quick/dealer/page.tsx
