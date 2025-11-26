// viz_gamewinrate_heatmap.js - Updated with 'const viz' pattern

(function () {
    // A cache for the data and a reference to the year slider
    let dataTable;
    let yearSlider;
    let uniqueYears;

    // Dimensions
    const surfaces = ['Hard', 'Clay', 'Grass'];
    const MARGIN_X = 150; // Space for player names
    const MARGIN_Y = 100; // Space for the year slider and surface labels

    // Color scale for Game Win Rate (from blue to red)
    // Rates are typically around 0.45 to 0.65
    function getColor(p, winRate) {
        // Map winRate from a typical range (e.g., 0.45 to 0.65) to a 0-1 scale
        const minRate = 0.45;
        const maxRate = 0.65;
        const normRate = p.constrain(p.map(winRate, minRate, maxRate, 0, 1), 0, 1);

        // Interpolate between a 'cool' blue (low rate) and a 'hot' red (high rate)
        const c1 = p.color(50, 100, 200); // Blue (low)
        const c2 = p.color(255, 255, 100); // Yellow (mid)
        const c3 = p.color(200, 50, 50); // Red (high)

        if (normRate < 0.5) {
            return p.lerpColor(c1, c2, normRate * 2);
        } else {
            return p.lerpColor(c2, c3, (normRate - 0.5) * 2);
        }
    }

    // Use a const to define the visualization logic
    // This is the object you would have referred to as 'viz' in your module scope.
    const Viz = {
        
        // This is called once by the manager's setData function, but we need to ensure p5.js is ready
        data: null,

        draw: function (p, manager, ai, progress) {

            // --- Load Data (only once) ---
            if (!dataTable) {
                // Load data using p5's loadTable
                dataTable = p.loadTable('player_game_win_rate_surface_time.csv', 'csv', 'header', () => {
                    // Data is loaded. Convert columns to appropriate types.
                    dataTable.columns.forEach(col => {
                        if (col === 'Year' || col === 'TotalGamesWon' || col === 'TotalGamesPlayed' || col === 'GameWinRate') {
                            for (let i = 0; i < dataTable.getRowCount(); i++) {
                                dataTable.setNum(i, col, parseFloat(dataTable.getString(i, col)));
                            }
                        }
                    });
                    
                    // Get unique years and sort them
                    uniqueYears = dataTable.getColumn('Year').map(Number).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
                    
                    // Create the Year Slider UI
                    if (p.select('#year-slider-container')) {
                        p.select('#year-slider-container').remove();
                    }

                    const container = p.createElement('div').id('year-slider-container').parent('vis');
                    container.style('position', 'absolute');
                    container.style('left', (manager.offsetX + MARGIN_X) + 'px');
                    container.style('top', (manager.offsetY + 30) + 'px');

                    const sliderLabel = p.createElement('span', 'Year: ').parent(container);
                    sliderLabel.style('color', '#333');
                    sliderLabel.id('year-label');

                    yearSlider = p.createSlider(0, uniqueYears.length - 1, uniqueYears.length - 1, 1).parent(container);
                    yearSlider.style('width', '200px');
                });
                // Exit draw until data is ready
                return;
            }

            if (!yearSlider) {
                // Data is loading, or slider hasn't been created yet.
                return;
            }
            
            p.push();
            p.translate(manager.offsetX, manager.offsetY);

            // --- Get Current Year and Filter Data ---
            const yearIndex = yearSlider.value();
            const currentYear = uniqueYears[yearIndex];
            p.select('#year-label').html('Year: ' + currentYear);

            // Get all rows for the current year
            const yearRows = dataTable.getRows().filter(row => row.getNum('Year') === currentYear);

            // Calculate each player's overall win rate for the year and total games played for sorting
            const playerYearData = {};
            yearRows.forEach(row => {
                const player = row.getString('Player');
                const gamesWon = row.getNum('TotalGamesWon');
                const gamesPlayed = row.getNum('TotalGamesPlayed');
                if (!playerYearData[player]) {
                    playerYearData[player] = { totalWon: 0, totalPlayed: 0, surfaceData: {} };
                }
                playerYearData[player].totalWon += gamesWon;
                playerYearData[player].totalPlayed += gamesPlayed;
                playerYearData[player].surfaceData[row.getString('surface')] = row.getNum('GameWinRate');
            });
            
            // Calculate overall year rate and sort players by total games played (top players first)
            const sortedPlayers = Object.keys(playerYearData)
                .map(player => ({
                    player: player,
                    totalPlayed: playerYearData[player].totalPlayed,
                    winRate: playerYearData[player].totalWon / playerYearData[player].totalPlayed
                }))
                .sort((a, b) => b.totalPlayed - a.totalPlayed) // Sort by total games played
                .slice(0, 20); // Select the Top 20 players

            const displayPlayers = sortedPlayers.map(p => p.player);
            const numPlayers = displayPlayers.length;
            const numSurfaces = surfaces.length;
            
            // --- Layout Calculations ---
            const plotWidth = manager.width - MARGIN_X;
            const plotHeight = manager.height - MARGIN_Y;
            const cellWidth = plotWidth / numSurfaces;
            const cellHeight = plotHeight / numPlayers;
            
            p.translate(MARGIN_X, MARGIN_Y);

            // --- Draw Heatmap ---
            for (let i = 0; i < numPlayers; i++) {
                const player = displayPlayers[i];
                const y = i * cellHeight;

                // Draw Player Name (Y-Axis Label)
                p.fill(0);
                p.textSize(10);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(player, -10, y + cellHeight / 2);

                for (let j = 0; j < numSurfaces; j++) {
                    const surface = surfaces[j];
                    const x = j * cellWidth;

                    const rate = playerYearData[player].surfaceData[surface];
                    
                    // Draw Heatmap Cell
                    if (rate !== undefined) {
                        p.fill(getColor(p, rate));
                        p.rect(x, y, cellWidth, cellHeight);
                        
                        // Draw Win Rate Text
                        p.fill(0);
                        p.textSize(12);
                        p.textAlign(p.CENTER, p.CENTER);
                        p.text(p.nf(rate, 0, 3), x + cellWidth / 2, y + cellHeight / 2);
                    } else {
                        // Draw empty cell if player hasn't played on this surface this year
                        p.fill(220);
                        p.rect(x, y, cellWidth, cellHeight);
                    }

                    // Draw Surface Label (X-Axis Label)
                    if (i === 0) {
                        p.fill(0);
                        p.textSize(14);
                        p.textAlign(p.CENTER, p.BOTTOM);
                        p.text(surface, x + cellWidth / 2, -10);
                    }
                }
            }

            // --- Draw Legend (Simplified) ---
            const legendX = plotWidth + 20;
            const legendY = 0;
            const legendHeight = plotHeight / 2;
            const legendWidth = 20;
            
            p.textSize(10);
            p.textAlign(p.LEFT, p.CENTER);
            p.text('Game Win Rate', legendX, legendY - 10);
            p.text('0.65', legendX + legendWidth + 5, legendY);
            p.text('0.45', legendX + legendWidth + 5, legendY + legendHeight);

            // Draw the gradient bar
            for (let i = 0; i < legendHeight; i++) {
                const rate = p.map(i, 0, legendHeight, 0.65, 0.45);
                p.fill(getColor(p, rate));
                p.noStroke();
                p.rect(legendX, legendY + i, legendWidth, 1);
            }

            p.pop();
        }
    };
    window.Viz_RQ3_b = Viz;
})();