import { gameSettings, gameState } from "./config.js"

$(document).ready(function() {
    initGame()

    $(document).on('keydown', checkKeyInput)
})

async function initGame() {
    await loadWordsList()
    setupGame()
}
  
async function loadWordsList() {
    try {
      const res = await fetch('./words.json')
      const data = await res.json()
      gameSettings.wordsList = [...data]
      gameSettings.wordsSet = new Set(data)
      console.log(gameSettings.wordsSet)
    } catch (err) {
      console.error("Errore nel caricamento della lista parole", err)
      alert("Errore nel caricamento della lista parole, prova ad aggiornare la pagina")
    }
}

function setupGame() {
    gameSettings.secretWord = gameSettings.wordsList[Math.floor(Math.random() * gameSettings.wordsList.length)]
    gameSettings.wordLength = gameSettings.secretWord.length
    console.log("The secret word is: " + gameSettings.secretWord)

    buildGrid(gameSettings.wordLength)
    createSecretWordObj(gameSettings.secretWord.toLowerCase(), gameSettings.secretWordObj)
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

function checkKeyInput(e) {
    const key = e.key.toLowerCase()
    
    if(/^[a-z]$/.test(key)) {
        handleLetterInput(key)
    } else if(key === 'backspace') {
        handleBackspaceInput(key)
    } else if(key === 'enter') {
        handleEnterInput(key)
    } 
}

function handleLetterInput(key) {
    if (gameState.currentTile < gameSettings.wordLength) {
        const $tile = $(`.row:eq(${gameState.currentRow}) .tile:eq(${gameState.currentTile})`)
        $tile.text(key).addClass('filled')
        gameState.currentTile++
    }
}

function handleBackspaceInput(key) {
    if (gameState.currentTile > 0) {
        gameState.currentTile--
        const $tile = $(`.row:eq(${gameState.currentRow}) .tile:eq(${gameState.currentTile})`)
        $tile.text('').removeClass('filled')
    }
}

function handleEnterInput(key) {
    if(gameState.currentTile !== gameSettings.wordLength) return

    const guessTiles = $(`.row:eq(${gameState.currentRow}) .tile`)
    
    const guessLetters = guessTiles.map(function() {
        return $(this).text().toLowerCase()
    }).get()

    const guess = guessLetters.join("")

    if(!gameSettings.wordsSet.has(guess)) {
        /*gameState.currentTile = 0
        guessTiles.removeClass("filled")
        guessTiles.empty()*/
        alert("Parola non presente nella lista")
        return
    }

    const secretWord = gameSettings.secretWord
    const rightLettersWrongPlace = []
    const secretWordObj = {...gameSettings.secretWordObj}

    guessTiles.each(function(i) {
        const char = guessLetters[i]
        
        if(char === secretWord[i]) {
            $(this).addClass('correct')
            secretWordObj[char]--
        } else {
            rightLettersWrongPlace.push({ index : i, char })
        }
    })

    rightLettersWrongPlace.forEach(({ index, char }) => {
        const tile = guessTiles.eq(index)
        if(secretWordObj[char] > 0) {
            tile.addClass('partially-correct')
            secretWordObj[char]--
        } else {
            tile.addClass('wrong')
        }
    })

    if(guess === secretWord) {
        console.log("INDOVINATO!")
        return
    }

    gameState.currentRow++
    gameState.currentTile = 0
}