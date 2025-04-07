import { gameSettings, gameState } from "./config.js"

$(document).ready(function() {
    buildGrid(gameSettings.wordLength)

    $(document).on('keydown', e => {
        const key = e.key.toLowerCase()

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
            const guess = $(`.row:eq(${gameState.currentRow}) .tile`)
            .map(function () {
                return $(this).text()
            })
            .get()
            .join('')
    
            console.log('Parola inserita:', guess)
    
            // Jump to next row
            gameState.currentRow++
            gameState.currentTile = 0
        }
    })
})

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