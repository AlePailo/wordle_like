import { gameSettings, gameState } from "./config.js"

$(document).ready(function() {
    initGame()
})

async function initGame() {
    await loadWordList()
    setupGame()
}
  
async function loadWordList() {
    try {
      const res = await fetch('./words.json')
      const data = await res.json()
      gameSettings.wordsList = [...data]
      gameSettings.secretWord = gameSettings.wordsList[Math.floor(Math.random() * gameSettings.wordsList.length)]
      gameSettings.wordLength = gameSettings.secretWord.length
      console.log("The secret word is: " + gameSettings.secretWord)
    } catch (err) {
      console.error("Errore nel caricamento del dizionario", err)
      alert("Errore nel caricamento del dizionario, prova ad aggiornare la pagina")
    }
}

function setupGame() {
    buildGrid(gameSettings.wordLength)
    createSecretWordObj(gameSettings.secretWord.toLowerCase(), gameSettings.secretWordObj)

    $(document).on('keydown', e => {
        const key = e.key.toLowerCase()
        console.log(gameSettings.secretWordObj)

        // If input is a letter (a-z)
        if (/^[a-z]$/.test(key)) {
            if (gameState.currentTile < gameSettings.wordLength) {
            const $tile = $(`.row:eq(${gameState.currentRow}) .tile:eq(${gameState.currentTile})`)
            $tile.text(key).addClass('filled')
            gameState.currentTile++
            }
        }

        // If input is a backspace
        else if (key === 'backspace') {
            if (gameState.currentTile > 0) {
            gameState.currentTile--
            const $tile = $(`.row:eq(${gameState.currentRow}) .tile:eq(${gameState.currentTile})`)
            $tile.text('').removeClass('filled')
            }
        }

        // If input is an enter
        else if (key === 'enter') {
            if(gameState.currentTile !== gameSettings.wordLength) return

            const guessTiles = $(`.row:eq(${gameState.currentRow}) .tile`)
            const guessLetters = []
            const secretWord = gameSettings.secretWord
            const partialMatches = []
            const secretWordObj = {...gameSettings.secretWordObj}

            //handle correct tiles
            guessTiles.each(function (i) {
                const char = $(this).text().toLowerCase();
                guessLetters.push(char);

                if (secretWord[i] === char) {
                    $(this).addClass("correct");
                    secretWordObj[char]--;
                } else {
                    partialMatches.push({ index: i, char });
                }
            });

            //handle partially correct and wrong tiles
            partialMatches.forEach(({ index, char }) => {
                const tile = guessTiles.eq(index);
                if (secretWordObj[char] > 0) {
                    tile.addClass("partially-correct");
                    secretWordObj[char]--;
                } else {
                    tile.addClass("wrong");
                }
            });

            //verify guess
            const guess = guessLetters.join("");
            if (guess === secretWord) {
                console.log("INDOVINATO!");
            }

            //jump to next row
            gameState.currentRow++;
            gameState.currentTile = 0;
        }
    })
}

function buildGrid(wordLength) {
    const board = $('.board')
    $('html').css('--word-length', wordLength)
    const numRows = 6

    const rows = Array.from({ length: numRows }, (_, rowIndex) => {
    const row = $('<div>').addClass('row')
    Array.from({ length: wordLength }).forEach(() => {
        $('<div>').addClass('tile').appendTo(row)
    })
    return row
    })

    board.append(rows)
}

function createSecretWordObj(secretWord, secretWordObj) {
    for (const char of secretWord) {
        secretWordObj[char] = (secretWordObj[char] ?? 0) + 1;
    }
}