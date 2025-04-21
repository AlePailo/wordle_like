import { gameSettings, gameState } from "./config.js"

$(document).ready(function() {
    initGame()

    $(document).on('keydown', checkKeyInput)
    $("#btn-restart-game").click(resetGame)
    $(".keyboard-key").click(checkDisplayKeyboardInput)
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
    gameState.secretWord = gameSettings.wordsList[Math.floor(Math.random() * gameSettings.wordsList.length)]
    gameState.wordLength = gameState.secretWord.length
    console.log("The secret word is: " + gameState.secretWord)
    gameState.secretWordObj = createSecretWordObj(gameState.secretWord.toLowerCase())

    buildGrid(gameState.wordLength)
    $('.keyboard-container').addClass('grid')
}

function buildGrid(wordLength) {
    const board = $('.board')
    $('html').css('--word-length', wordLength)

    const rows = Array.from({ length: gameSettings.maxChances }, (_, rowIndex) => {
        const row = $('<div>').addClass('row grid')
        Array.from({ length: wordLength }).forEach(() => {
            $('<div>').addClass('tile').appendTo(row)
        })
        return row
    })

    board.append(rows)
}

function createSecretWordObj(secretWord) {
    const obj = {}
    for (const char of secretWord) {
        obj[char] = (obj[char] ?? 0) + 1;
    }
    return obj
}

function checkKeyInput(e) {
    if(gameState.isGameOver) return

    const key = e.key.toLowerCase()
    
    if(/^[a-z]$/.test(key)) {
        handleLetterInput(key)
    } else if(key === 'backspace') {
        handleBackspaceInput()
    } else if(key === 'enter') {
        handleEnterInput()
    }
}

function checkDisplayKeyboardInput() {
    if(gameState.isGameOver) return

    const key = $(this).attr("data-key")

    if(/^[a-z]$/.test(key)) {
        handleLetterInput(key)
    } else if(key === 'del') {
        handleBackspaceInput()
    } else if(key === 'enter') {
        handleEnterInput()
    }
}

function handleLetterInput(key) {
    if (gameState.currentTile < gameState.wordLength) {
        const $tile = $(`.row:eq(${gameState.currentRow}) .tile:eq(${gameState.currentTile})`)
        $tile.text(key).addClass('filled')
        gameState.currentTile++
    }
}

function handleBackspaceInput() {
    if (gameState.currentTile > 0) {
        gameState.currentTile--
        const $tile = $(`.row:eq(${gameState.currentRow}) .tile:eq(${gameState.currentTile})`)
        $tile.text('').removeClass('filled')
    }
}

function handleEnterInput() {
    if(gameState.currentTile !== gameState.wordLength) return

    const guessTiles = $(`.row:eq(${gameState.currentRow}) .tile`)
    
    const guessLetters = guessTiles.map(function() {
        return $(this).text().toLowerCase()
    }).get()

    const guess = guessLetters.join("")

    if(!gameSettings.wordsSet.has(guess)) {
        const $guessRow = $(`.row:eq(${gameState.currentRow})`)
        $guessRow.addClass('shake')
        $guessRow.on('animationend', function() {
            $(this).removeClass('shake')
        })

        showToast("Parola non presente nella lista")

        return
    }

    const secretWord = gameState.secretWord
    const rightLettersWrongPlace = []
    const secretWordObj = {...gameState.secretWordObj}

    // Calcolo del tempo massimo necessario per completare i flip
    const flipDelay = 300
    const flipDuration = 300
    const totalFlipTime = guessTiles.length * flipDelay + flipDuration

    // Step 1: Assegna lo stato ma non la classe
        guessTiles.each(function(i) {
            const tile = $(this)
            const char = guessLetters[i]

            if (char === secretWord[i]) {
                tile.attr('data-state', 'correct')
                secretWordObj[char]--
            } else {
                rightLettersWrongPlace.push({ index: i, char })
            }
        })

        // Step 2: lettere parziali o sbagliate
        rightLettersWrongPlace.forEach(({ index, char }) => {
            const tile = guessTiles.eq(index)
            if (secretWordObj[char] > 0) {
                tile.attr('data-state', 'partially-correct')
                secretWordObj[char]--
            } else {
                tile.attr('data-state', 'wrong')
            }
        })

        // Step 3: Anima i tile uno a uno
        guessTiles.each(function(i) {
            const tile = $(this)
            setTimeout(() => {
                tile.addClass('flip')
                tile.on('animationend', function() {
                    tile.removeClass('flip')
                })
                setTimeout(() => {
                    const state = tile.attr('data-state')
                    if (state) {
                        tile.addClass(state)
                        updateDisplayKeyboardKeyColor(tile.text(), state)
                    }
                }, flipDuration / 2)
            }, i * flipDelay)
        })

        // Step 4: Post-flip azioni finali
        setTimeout(() => {
            if (guess === secretWord) {
                // Bounce animation
                guessTiles.each(function(i) {
                    const tile = $(this)
                    setTimeout(() => {
                        tile.addClass('bounce')
                    }, i * 100)
                })

                gameState.isGameOver = true
                updateStats(true, gameState.currentRow + 1)
                showEndMessage('Hai indovinato!', `Tentativi: ${gameState.currentRow + 1}`)
                return
            }

            gameState.currentRow++
            gameState.currentTile = 0

            if (gameState.currentRow > 5) {
                gameState.isGameOver = true
                updateStats(false)
                showEndMessage('Peccato!', `La parola era ${gameState.secretWord.toUpperCase()}`)
            }
        }, totalFlipTime)
}

function resetGame() {
    gameState.currentRow = 0
    gameState.currentTile = 0
    gameState.isGameOver = false
    gameState.secretWordObj = {}

    $('.board').empty()

    hideEndMessage()
    $('.keyboard-container').removeClass('grid')
    $('.keyboard-key').removeClass('correct-keyboard-key partially-correct-keyboard-key wrong-keyboard-key')
    setupGame()
}

function showEndMessage(title, guesses) {
    const playerStats = JSON.parse(localStorage.getItem('playerStats'))
    const $endMessage = $('#end-message')
    $('#end-message-title').text(title)
    $("#total-guesses").text(guesses)
    const statsValue = $('.stats-value')
    statsValue.eq(0).text(playerStats.playedGames)
    statsValue.eq(1).text(playerStats.winPercentage)
    statsValue.eq(2).text(playerStats.currentStreak)
    statsValue.eq(3).text(playerStats.maxStreak)
    $endMessage.removeClass('show')
    void $endMessage[0].offsetWidth
    $endMessage.addClass('show')
    renderStatsGraph()
    setTimeout(() => {$('#btn-restart-game').focus()}, 0)
}

function hideEndMessage() {
    const $endMessage = $('#end-message')
    $endMessage.removeClass('show')
}


function updateDisplayKeyboardKeyColor(key, level) {
    const $key = $(`.keyboard-key[data-key=${key}]`)

    if ($key.hasClass('correct-keyboard-key')) return

    if(level === 'correct') {
        $key.removeClass('partially-correct-keyboard-key').addClass('correct-keyboard-key')
        return
    }

    if(level === 'partially-correct') {
        $key.addClass('partially-correct-keyboard-key')
        return
    }

    if(level === 'wrong') $key.addClass('wrong-keyboard-key')
}

function showToast(message) {
    const $toast = $('.notification')
    $toast.text(message).addClass('show')

    setTimeout(() => {
        $toast.removeClass('show')
    }, 2000)
}


function updateStats(win, attempts) {

    const playerStats = JSON.parse(localStorage.getItem('playerStats')) || {
        guessesDistribution : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        playedGames : 0,
        winCount : 0,
        winPercentage : 0,
        currentStreak : 0,
        maxStreak : 0
    }

    if(win) {
        playerStats.guessesDistribution[attempts]++
        playerStats.winCount++
        playerStats.currentStreak++
        if(playerStats.currentStreak > playerStats.maxStreak) playerStats.maxStreak = playerStats.currentStreak
    } else {
        playerStats.currentStreak = 0
    }

    playerStats.playedGames++
    playerStats.winPercentage = Math.round(playerStats.winCount / playerStats.playedGames * 100)

    localStorage.setItem('playerStats', JSON.stringify(playerStats))
    console.log(localStorage.getItem('playerStats'))
}


function renderStatsGraph() {
    const playerStats = JSON.parse(localStorage.getItem('playerStats')) || {}
    const guessesDistribution = playerStats.guessesDistribution
    const container = $('#stats-graph')
    container.empty()

    const allValues = Object.values(guessesDistribution)
    const max = Math.max(...allValues, 1) // per evitare divisione per 0

    for (let i = 1; i <= gameSettings.maxChances; i++) {
        const count = guessesDistribution[i] || 0
        const percentage = (count / max) * 100
        console.log(count, percentage)

        container.append(`
            <div class="stat-row">
                <span>${i}</span>
                <div class="bar" style="width: ${percentage}%">${count}</div>
            </div>
        `)
    }

    /*// Falliti
    const failCount = stats.fail || 0
    const failPerc = (failCount / max) * 100
    container.append(`
        <div class="stat-row">
            <span>X</span>
            <div class="bar" style="width: ${failPerc}%">${failCount}</div>
        </div>
    `)*/
}