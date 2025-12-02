// viz_rq3_b.js
(function () {
    const Viz = {
        localData: null,
        isDataLoading: false,
        ATP_FILE_PATH: 'data/raw/atp_matches.csv', 
        WTA_FILE_PATH: 'data/raw/wta-grandslam.csv',
      
        filteredData: null,
        hoveredCell: null,
    
        yearFilterSelect: null,
        surfaceFilterSelect: null,
        filterWrapper: null, 

        TOP_PLAYERS: [
            'Federer R.', 'Nadal R.', 'Djokovic N.', 'Murray A.', 'Wawrinka S.', 'Del Potro J.',
            'Williams S.', 'Sharapova M.', 'Halep S.', 'Swiatek I.', 'Azarenka V.', 'Osaka N.'
        ],

        parseScore: function (score, playerIsWinner) {
            if (!score || score.includes('/') || score.includes('RET') || score.includes('W/O') || score.includes('DEF') || score.includes('UNP') || score.includes('.')) {
                return { won: 0, played: 0 };
            }

            const sets = score.split(' ');
            let gamesWon = 0;
            let gamesLost = 0;

            for (const set of sets) {
                const cleanSet = set.replace(/\([\d]+\)/g, '');
                const gameScores = cleanSet.split('-');
                
                if (gameScores.length !== 2) continue;

                let s1 = parseInt(gameScores[0]);
                let s2 = parseInt(gameScores[1]);
                
                if (isNaN(s1) || isNaN(s2)) continue;

                if (playerIsWinner) {
                    gamesWon += s1;
                    gamesLost += s2;
                } else {
                    gamesWon += s2;
                    gamesLost += s1;
                }
            }
            return { won: gamesWon, played: gamesWon + gamesLost };
        },

        parseATP: function (csvText) {
             const lines = csvText.trim().split('\r\n');
            const headers = lines[0].split(',');
            const dataRows = lines.slice(1);
            
            const dateCol = headers.indexOf('Date');
            const surfaceCol = headers.indexOf('Surface');
            const player1Col = headers.indexOf('Player_1');
            const player2Col = headers.indexOf('Player_2');
            const winnerCol = headers.indexOf('Winner');
            const scoreCol = headers.indexOf('Score');
            
            const playerStats = {};

            dataRows.forEach(rowString => {
                const row = rowString.split(',');
                
                const date = row[dateCol];
                const surface = row[surfaceCol];
                const player1 = row[player1Col];
                const player2 = row[player2Col];
                const winner = row[winnerCol];
                const score = row[scoreCol];
                
                if (!date || !surface || !player1 || !player2 || !winner || !score || score.trim() === '-1.0') return;
                
                const year = parseInt(date.substring(0, 4));
                if (isNaN(year) || year < 2000) return;

                const player1Stats = this.parseScore(score, winner === player1);
                const player2Stats = this.parseScore(score, winner === player2);

                const aggregate = (player, stats) => {
                    if (this.TOP_PLAYERS.includes(player)) {
                        const key = `${player}-${year}-${surface}`;
                        if (!playerStats[key]) {
                            playerStats[key] = { won: 0, played: 0, Player: player, Year: year, Surface: surface };
                        }
                        playerStats[key].won += stats.won;
                        playerStats[key].played += stats.played;
                    }
                };

                aggregate(player1, player1Stats);
                aggregate(player2, player2Stats);
            });
            
            return playerStats;
        },

        parseWTA: function (csvText) {
            const lines = csvText.trim().split('\r\n');
            const headers = lines[0].split(',');
            const dataRows = lines.slice(1);

            const dateCol = headers.indexOf('tourney_date');
            const surfaceCol = headers.indexOf('surface');
            const winnerNameCol = headers.indexOf('winner_name');
            const loserNameCol = headers.indexOf('loser_name');
            const scoreCol = headers.indexOf('score');
            
            const playerStats = {};

            dataRows.forEach(rowString => {
                const row = rowString.split(',');
                
                const date = row[dateCol];
                const surface = row[surfaceCol];
                const winner = row[winnerNameCol];
                const loser = row[loserNameCol];
                const score = row[scoreCol];
                
                if (!date || !surface || !winner || !loser || !score) return;
                
                const year = parseInt(date.substring(0, 4));
                if (isNaN(year) || year < 2000) return;

                const winnerStats = this.parseScore(score, true); 
                const loserStats = this.parseScore(score, false);

                const aggregate = (player, stats) => {
                    if (this.TOP_PLAYERS.includes(player)) {
                        const key = `${player}-${year}-${surface}`;
                        if (!playerStats[key]) {
                            playerStats[key] = { won: 0, played: 0, Player: player, Year: year, Surface: surface };
                        }
                        playerStats[key].won += stats.won;
                        playerStats[key].played += stats.played;
                    }
                };

                aggregate(winner, winnerStats);
                aggregate(loser, loserStats);
            });
            
            return playerStats;
        },

        loadData: function (p, manager) {
             if (this.isDataLoading) return;
            this.isDataLoading = true;
            
            const atpPromise = fetch(this.ATP_FILE_PATH).then(res => res.text());
            const wtaPromise = fetch(this.WTA_FILE_PATH).then(res => res.text());

            Promise.all([atpPromise, wtaPromise])
                .then(([atpCsv, wtaCsv]) => {
                    const atpStats = this.parseATP(atpCsv);
                    const wtaStats = this.parseWTA(wtaCsv);
                    const combinedStats = { ...atpStats, ...wtaStats };

                    const processedData = Object.values(combinedStats)
                        .filter(d => d.played > 100)
                        .map(d => ({
                            Year: d.Year,
                            Surface: d.Surface,
                            Player: d.Player,
                            Rate: d.won / d.played
                        }));
                    
                    this.localData = processedData;
                    this.filteredData = processedData; 
                    this.isDataLoading = false;

                    this.initializeFilters(p, processedData);
                    
                    if (manager && manager.p5) {
                        manager.p5.redraw(); 
                    }
                })
                .catch(error => {
                    console.error('Viz_RQ3_B: Error loading or parsing data:', error);
                    this.localData = []; 
                    this.filteredData = [];
                    this.isDataLoading = false;
                });
        },
        
        //Filter Visibility Management
        toggleFilters: function(show) {
            if (this.filterWrapper) {
                this.filterWrapper.style('display', show ? 'block' : 'none');
            }
        },
      
        applyFilters: function(p, allData) {
             const selectedYear = this.yearFilterSelect ? this.yearFilterSelect.value() : 'All Years';
            const selectedSurface = this.surfaceFilterSelect ? this.surfaceFilterSelect.value() : 'All Surfaces';

            let data = allData;
            
            if (selectedYear !== 'All Years') {
                data = data.filter(d => d.Year === parseInt(selectedYear));
            }
            if (selectedSurface !== 'All Surfaces') {
                data = data.filter(d => d.Surface === selectedSurface);
            }
            
            this.filteredData = data;
            p.redraw();
        },
        
        initializeFilters: function(p, allData) {
            if (this.filterWrapper) return;

            const uniqueYears = Array.from(new Set(allData.map(d => d.Year))).sort((a, b) => a - b);
            const uniqueSurfaces = Array.from(new Set(allData.map(d => d.Surface))).sort();
            
            const parentDiv = p.select('#vis');
            
            this.filterWrapper = p.createElement('div');
            this.filterWrapper.id('rq3b-filters-wrapper');
            this.filterWrapper.parent(parentDiv); 
            
            this.toggleFilters(false);
            
            // Year Filter
            const yearLabel = p.createElement('span', 'Filter Year: ');
            yearLabel.style('margin-left', '10px');
            yearLabel.parent(this.filterWrapper);
            
            this.yearFilterSelect = p.createSelect();
            this.yearFilterSelect.parent(this.filterWrapper);
            this.yearFilterSelect.option('All Years');
            uniqueYears.forEach(year => this.yearFilterSelect.option(year));
            this.yearFilterSelect.changed(() => this.applyFilters(p, this.localData));

            // Surface Filter
            const surfaceLabel = p.createElement('span', 'Filter Surface: ');
            surfaceLabel.style('margin-left', '20px');
            surfaceLabel.parent(this.filterWrapper);
            
            this.surfaceFilterSelect = p.createSelect();
            this.surfaceFilterSelect.parent(this.filterWrapper);
            this.surfaceFilterSelect.option('All Surfaces');
            uniqueSurfaces.forEach(surface => this.surfaceFilterSelect.option(surface));
            this.surfaceFilterSelect.changed(() => this.applyFilters(p, this.localData));
        },

        checkHover: function(p, plotX, plotY, finalCellWidth, finalCellHeight, years, y_axis_labels) {
            if (p.mouseX >= plotX && p.mouseY >= plotY) {
                const finalPlotWidth = finalCellWidth * years.length;
                const finalPlotHeight = finalCellHeight * y_axis_labels.length;
                
                if (p.mouseX <= plotX + finalPlotWidth && p.mouseY <= plotY + finalPlotHeight) {
                    
                    const colIndex = p.floor((p.mouseX - plotX) / finalCellWidth);
                    const rowIndex = p.floor((p.mouseY - plotY) / finalCellHeight);
                    
                    const hoveredYear = years[colIndex];
                    const hoveredLabel = y_axis_labels[rowIndex];
                    
                    const hoveredDataPoint = this.filteredData.find(d => 
                        d.Year === hoveredYear && `${d.Player}-${d.Surface}` === hoveredLabel
                    );
                    
                    this.hoveredCell = {
                        x: plotX + colIndex * finalCellWidth,
                        y: plotY + rowIndex * finalCellHeight,
                        width: finalCellWidth,
                        height: finalCellHeight,
                        data: hoveredDataPoint
                    };
                    return;
                }
            }
            this.hoveredCell = null;
        },
        
        drawTooltip: function(p) {
            if (!this.hoveredCell || !this.hoveredCell.data) return;

            const { x, y, data } = this.hoveredCell;
            const rate = data.Rate;
            
            const tooltipText = `${data.Player} (${data.Surface}, ${data.Year})\nWin Rate: ${p.nf(rate * 100, 0, 1)}%`;
            
            const padding = 5;
            p.textSize(12);
            const textLines = tooltipText.split('\n');
        
            const textWidth = Math.max(p.textWidth(textLines[0]), p.textWidth(textLines[1] || ''));
            const textHeight = (p.textAscent() + p.textDescent()) * 2 + padding * 3;
            
            const boxX = p.constrain(x + this.hoveredCell.width / 2 + 10, padding, p.width - textWidth - padding * 2 - 10);
            const boxY = p.constrain(y + this.hoveredCell.height / 2, padding, p.height - textHeight - padding);
            
            p.fill(255, 255, 200, 240);
            p.noStroke();
            p.rect(boxX, boxY, textWidth + padding * 2, textHeight, 5);
            
            p.fill(0);
            p.textAlign(p.LEFT, p.TOP);
            p.text(textLines[0], boxX + padding, boxY + padding);
            p.text(textLines[1], boxX + padding, boxY + padding + 15);
        },
   
        draw: function (p, manager, ai, progress) {
            if (this.filterWrapper) {
                 this.toggleFilters(true);
            }
          
            if (this.localData === null) {
                if (!this.isDataLoading) {
                    this.loadData(p, manager); 
                }
                
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text('Loading and processing raw ATP & WTA data...', manager.width / 2, manager.height / 2);
                return;
            }
            
            const data = this.filteredData;
            
            if (data.length === 0) {
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text('No data available for current filter selection.', manager.width / 2, manager.height / 2);
                return;
            }
       
            const plotX = manager.offsetX + 80; 
            const plotY = manager.offsetY + 80; 
 
            const legendMargin = 250; 
            const availablePlotWidth = manager.width - plotX - legendMargin; 
  
            const bottomMargin = 80; 
            const availablePlotHeight = manager.height - plotY - bottomMargin; 
            
            const num_cols = Array.from(new Set(data.map(d => d.Year))).length;
            const num_rows = Array.from(new Set(data.map(d => `${d.Player}-${d.Surface}`))).length; 
            const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);
            const y_axis_labels = Array.from(new Set(data.map(d => `${d.Player}-${d.Surface}`))).sort(); 
            
            const minCellWidth = 15;
            const minCellHeight = 15;

            const idealCellHeight = availablePlotHeight / num_rows;
            let finalCellHeight;
            let finalPlotHeight;
            
            if (idealCellHeight < minCellHeight) {
                finalCellHeight = minCellHeight;
                finalPlotHeight = num_rows * finalCellHeight; 
            } else {
                finalCellHeight = idealCellHeight;
                finalPlotHeight = availablePlotHeight; 
            }
      
            const idealCellWidth = availablePlotWidth / num_cols;
            let finalCellWidth;
            let finalPlotWidth;
            
            if (idealCellWidth < minCellWidth) {
                finalCellWidth = minCellWidth;
                finalPlotWidth = num_cols * finalCellWidth; 
            } else {
                finalCellWidth = idealCellWidth;
                finalPlotWidth = availablePlotWidth;
            }

            const cellMargin = 0.1; 
            
            function getColor(p, rate) {
                const lowColor = p.color(255, 100, 100); 
                const midColor = p.color(255, 255, 100); 
                const highColor = p.color(100, 255, 100); 

                if (rate < 0.55) {
                    const normalizedRate = p.map(rate, 0.45, 0.55, 0, 1, true);
                    return p.lerpColor(lowColor, midColor, normalizedRate);
                } else {
                    const normalizedRate = p.map(rate, 0.55, 0.65, 0, 1, true);
                    return p.lerpColor(midColor, highColor, normalizedRate);
                }
            }
   
            p.fill(0);
            p.textAlign(p.CENTER, p.TOP); 
            p.textSize(18);
            
            // Calculate center point of the available plot area
            const centerPlotX = plotX + finalPlotWidth / 2;
            const titleY = manager.offsetY + 30;
            
            p.text('Top Tennis Players Game Win Rates by Year and Surface', centerPlotX, titleY);

            p.push();
            p.translate(plotX, plotY);
            p.noStroke();

            data.forEach(d => {
                const yearIndex = years.indexOf(d.Year);
                const yAxisLabel = `${d.Player}-${d.Surface}`;
                const rowIndex = y_axis_labels.indexOf(yAxisLabel);

                if (yearIndex !== -1 && rowIndex !== -1) {
                    const x = yearIndex * finalCellWidth;
                    const y = rowIndex * finalCellHeight;
                    const rate = d.Rate;

                    p.fill(getColor(p, rate));
                    p.rect(x + cellMargin * finalCellWidth / 2, y + cellMargin * finalCellHeight / 2,
                           finalCellWidth * (1 - cellMargin), finalCellHeight * (1 - cellMargin));
                }
            });

            p.pop();

            const canvasBottomY = plotY + finalPlotHeight; 
            
            // X-Axis Labels (Years)
            p.fill(0);
            p.textSize(10);
            p.textAlign(p.CENTER, p.TOP);
            years.forEach((year, i) => {
                const x = plotX + i * finalCellWidth + finalCellWidth / 2;
                p.push();
                p.translate(x, canvasBottomY + 5); 
                p.rotate(p.HALF_PI / 2); 
                p.text(year, 0, 0);
                p.pop();
            });

            const maxNameWidth = plotX - 5; 
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(10);

            y_axis_labels.forEach((label, i) => {
                const y = plotY + i * finalCellHeight + finalCellHeight / 2;
                const [player, surface] = label.split('-');
                let name = `${player} (${surface})`;
        
                if (p.textWidth(name) > maxNameWidth - manager.offsetX) {
                    let truncatedName = '';
                    for(let char of name) {
                        if (p.textWidth(truncatedName + char + '...') < maxNameWidth - manager.offsetX) {
                            truncatedName += char;
                        } else {
                            name = truncatedName + '...';
                            break;
                        }
                    }
                }
                p.text(name, plotX - 5, y);
            });

            this.checkHover(p, plotX, plotY, finalCellWidth, finalCellHeight, years, y_axis_labels);
            this.drawTooltip(p);
    
            // Legend
            const legendWidth = 20;
            const legendHeight = finalPlotHeight / 2; 
           
            const legendX = plotX + finalPlotWidth + 20;
            const legendY = plotY;

            p.textSize(10);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.text('Game Win Rate', legendX, legendY - 10);

            for (let i = 0; i < legendHeight; i++) {
                const rate = p.map(i, 0, legendHeight, 0.65, 0.45);
                p.fill(getColor(p, rate));
                p.rect(legendX, legendY + i, legendWidth, 1);
            }

            p.fill(0);
            p.textAlign(p.LEFT, p.CENTER);
            p.text('0.65 (High)', legendX + legendWidth + 5, legendY);
            p.text('0.45 (Low)', legendX + legendWidth + 5, legendY + legendHeight);
            
            p.fill(240);
            p.rect(legendX, legendY + legendHeight + 20, legendWidth, legendWidth);
            p.fill(0);
            p.textAlign(p.LEFT, p.CENTER);
            p.text('No Data', legendX + legendWidth + 5, legendY + legendHeight + 20 + legendWidth / 2);
            

            if (this.filterWrapper) {
                const estimatedWrapperWidth = 450; 
                const filterX = plotX + finalPlotWidth / 2 - estimatedWrapperWidth / 2; 
          
                const filterY = canvasBottomY + 50; 
                
                this.filterWrapper.position(filterX, filterY);
                this.filterWrapper.style('width', `${estimatedWrapperWidth}px`); 
                this.filterWrapper.style('text-align', 'left'); 
            }
        }
    };
    window.Viz_RQ3_B = Viz;
})();