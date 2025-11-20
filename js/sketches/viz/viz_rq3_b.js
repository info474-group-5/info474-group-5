// viz_rq3_b.js
// RQ3B – Interactive Heat Map: Player Game Winning Rate by Surface Over Time (ATP ONLY)

(function () {
  const Viz = {
    // Configuration
    TOP_PLAYERS_COUNT: 25,
    MIN_MATCHES_PER_CELL: 10,
    
    // State and data
    atpTable: null,
    allData: [],
    playerList: [],
    years: [],
    surfaces: ["Hard", "Clay", "Grass"],
    currentSurface: "Hard",
    initialized: false,
    
    // Rendering scales
    margin: { top: 80, right: 100, bottom: 80, left: 160 },
    chartW: 0,
    chartH: 0,
    xScale: null,
    yScale: null,
    colorScale: null,
    
    hoverCell: null, // { player, year, surface, avg_gwr, matches_count }

    parseScore: function (scoreString) {
      // Basic checks for non-match results
      if (!scoreString || scoreString.includes('RET') || scoreString.includes('W/O') || scoreString.includes('DEF') || scoreString.includes('ABD') || scoreString.includes('Walkover')) {
        return { p1Games: NaN, p2Games: NaN };
      }
      
      let p1Games = 0;
      let p2Games = 0;

      // Remove content in parentheses (tiebreak scores) and split by space
      const sets = scoreString.replace(/\([^)]+\)/g, '').trim().split(' ');

      for (const set of sets) {
        if (!set.includes('-')) continue;
        
        const [p1Score, p2Score] = set.split('-');
        
        const p1 = parseInt(p1Score);
        const p2 = parseInt(p2Score);

        if (!isNaN(p1) && !isNaN(p2)) {
          p1Games += p1;
          p2Games += p2;
        } else {
          // Invalid score format
          return { p1Games: NaN, p2Games: NaN };
        }
      }
      
      // If no valid sets were parsed, return NaN
      if (p1Games === 0 && p2Games === 0) {
          return { p1Games: NaN, p2Games: NaN };
      }
      
      return { p1Games, p2Games };
    },

    processData: function (p) {
      console.log("Processing ATP Data...");
      let allMatches = [];
      const allPlayers = new Map(); // Map<player_name, total_matches>
      
      if (!this.atpTable) return;
      
      // Helper function to process a single match row
      const processRow = (row) => {
        const score = row.getString('Score');
        const winnerName = row.getString('Winner');
        const loserName = row.getString('Player_2');
        let surface = row.getString('Surface');
        const dateStr = row.getString('Date');
        
        // Skip if essential data is missing
        if (!score || !winnerName || !loserName || !surface || !dateStr) return;
        
        // Normalize surface names (if needed, but ATP usually uses Hard/Clay/Grass)
        if (!this.surfaces.includes(surface)) return; // Skip carpet, etc.

        const { p1Games, p2Games } = this.parseScore(score);

        if (isNaN(p1Games) || isNaN(p2Games) || p1Games + p2Games === 0) return;

        const totalGames = p1Games + p2Games;
        
        // Winner's GWR is games won (p1Games) divided by total games
        const winnerGWR = p1Games / totalGames;
        // Loser's GWR is games won (p2Games) divided by total games
        const loserGWR = p2Games / totalGames;
        
        const year = parseInt(dateStr.substring(0, 4));
        if (isNaN(year) || year < 2000) return;

        // Winner's record
        allMatches.push({
          player: winnerName,
          year: year,
          surface: surface,
          gwr: winnerGWR,
          isWinner: true
        });

        // Loser's record
        allMatches.push({
          player: loserName,
          year: year,
          surface: surface,
          gwr: loserGWR,
          isWinner: false
        });
        
        // Count total matches for all players for later filtering
        allPlayers.set(winnerName, (allPlayers.get(winnerName) || 0) + 1);
        allPlayers.set(loserName, (allPlayers.get(loserName) || 0) + 1);
      };
      
      // 1. Process ATP Matches
      for (let i = 0; i < this.atpTable.getRowCount(); i++) {
        processRow(this.atpTable.getRow(i));
      }
      
      // 2. Filter for the Top N Players (based on total match count)
      const sortedPlayers = Array.from(allPlayers.entries())
        .sort((a, b) => b[1] - a[1]) // Sort descending by match count
        .slice(0, this.TOP_PLAYERS_COUNT);
        
      this.playerList = sortedPlayers.map(d => d[0]);
      
      // 3. Aggregate Data by Player, Year, and Surface
      const aggregated = new Map(); // Key: 'Player|Year|Surface'
      const yearSet = new Set();
      
      for (const match of allMatches) {
        if (!this.playerList.includes(match.player)) continue; // Only keep data for top players
        
        const key = `${match.player}|${match.year}|${match.surface}`;
        if (!aggregated.has(key)) {
          aggregated.set(key, {
            player: match.player,
            year: match.year,
            surface: match.surface,
            gwrSum: 0,
            count: 0
          });
        }
        
        aggregated.get(key).gwrSum += match.gwr;
        aggregated.get(key).count += 1;
        yearSet.add(match.year);
      }

      // 4. Finalize data structure
      this.allData = Array.from(aggregated.values())
        .map(d => ({
          player: d.player,
          year: d.year,
          surface: d.surface,
          avg_gwr: d.gwrSum / d.count,
          matches_count: d.count
        }))
        .filter(d => d.matches_count >= this.MIN_MATCHES_PER_CELL); // Filter out players with too few matches in that cell

      this.years = Array.from(yearSet).sort((a, b) => a - b);
      
      console.log(`ATP Data Ready. Players: ${this.playerList.length}, Years: ${this.years.length}`);
    },

    ensureInit: function (p, manager) {
      if (this.initialized) return;
      
      this.chartW = manager.width - this.margin.left - this.margin.right;
      this.chartH = manager.height - this.margin.top - this.margin.bottom;
      
      // Load ATP table
      this.atpTable = p.loadTable(
        "data/raw/atp_matches.csv",
        "csv",
        "header",
        (t) => {
          this.atpTable = t;
          this.processData(p);
        },
        (error) => {
            console.error("Failed to load atp_matches.csv:", error);
        }
      );
      
      this.initialized = true;
    },

    initScales: function (p) {
      this.xScale = p.scaleBand()
        .domain(this.years)
        .range([0, this.chartW])
        .padding(0.05);

      this.yScale = p.scaleBand()
        // Ensure playerList is in a consistent order (e.g., total matches or alphabetical)
        .domain(this.playerList) 
        .range([0, this.chartH])
        .padding(0.05);

      // Define color scheme based on surface for distinction
      let lowColor, midColor, highColor;
      
      switch (this.currentSurface) {
        case 'Hard': // Blue/Standard
          lowColor = p.color(240);
          midColor = p.color(150, 150, 255);
          highColor = p.color(30, 115, 190); 
          break;
        case 'Clay': // Red/Orange
          lowColor = p.color(240);
          midColor = p.color(255, 170, 170);
          highColor = p.color(200, 50, 50);
          break;
        case 'Grass': // Green
        default:
          lowColor = p.color(240);
          midColor = p.color(170, 255, 170);
          highColor = p.color(44, 130, 71);
          break;
      }
      
      // Color scale from 50% (light/neutral) to ~75% (dark/high) Game Winning Rate (GWR)
      this.colorScale = p.scaleLinear()
        .domain([0.5, 0.6, 0.75])
        .range([lowColor, midColor, highColor]);
    },

    draw: function (p, manager, ai, progress) {
      this.ensureInit(p, manager);
      
      p.push();
      p.translate(this.margin.left, this.margin.top);
      
      // If data is not yet loaded, show loading message
      if (!this.allData || this.allData.length === 0) {
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(100);
        const loadingText = this.atpTable ? 
            "Processing ATP match data..." : 
            "Loading atp_matches.csv...";
            
        p.text(loadingText, this.chartW / 2, this.chartH / 2);
        p.pop();
        return;
      }
      
      // Initialize scales once data is ready
      if (!this.xScale) {
        this.initScales(p);
      }
      
      this.drawAxes(p);
      this.drawHeatMap(p);
      this.drawSurfaceSelector(p, manager);
      this.drawLegend(p);
      
      // Draw tooltip if hovering over a cell
      if (this.hoverCell) {
        const x = this.xScale(this.hoverCell.year) + this.xScale.bandwidth() / 2;
        const y = this.yScale(this.hoverCell.player) + this.yScale.bandwidth() / 2;
        this.drawTooltip(p, x, y, [
          this.hoverCell.player,
          `Year: ${this.hoverCell.year}`,
          `Surface: ${this.hoverCell.surface}`,
          `Avg. GWR: ${p.nf(this.hoverCell.avg_gwr * 100, 0, 2)}%`,
          `Matches: ${this.hoverCell.matches_count} (min ${this.MIN_MATCHES_PER_CELL})`
        ]);
      }
      
      p.pop();
      // Check for hover outside of p.push/pop to use screen coordinates
      this.checkHover(p);
    },

    drawHeatMap: function (p) {
      const currentData = this.allData.filter(d => d.surface === this.currentSurface);
      
      for (const d of currentData) {
        const x = this.xScale(d.year);
        const y = this.yScale(d.player);
        const w = this.xScale.bandwidth();
        const h = this.yScale.bandwidth();
        
        if (x !== undefined && y !== undefined) {
          p.fill(this.colorScale(d.avg_gwr));
          p.noStroke();
          p.rect(x, y, w, h);
          
          // Add a small text for GWR percentage
          p.fill(p.brightness(this.colorScale(d.avg_gwr)) > 180 ? 0 : 255);
          p.textSize(8);
          p.textAlign(p.CENTER, p.CENTER);
          // Only show GWR for cells with a meaningful size
          if (w > 20 && h > 10) { 
              p.text(p.nf(d.avg_gwr * 100, 0, 0), x + w/2, y + h/2);
          }
        }
      }
    },

    drawAxes: function (p) {
      // Title
      p.fill(40);
      p.textSize(18);
      p.textAlign(p.CENTER, p.TOP);
      p.text(`ATP Average Game Winning Rate (GWR) Heat Map: ${this.currentSurface}`, this.chartW / 2, -50);
      p.textSize(12);
      p.text(`Top ${this.TOP_PLAYERS_COUNT} Most Active Players by Year and Surface`, this.chartW / 2, -30);

      p.stroke(200);
      p.line(0, 0, 0, this.chartH);
      p.line(0, this.chartH, this.chartW, this.chartH);

      // X-axis (Years)
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.fill(40);
      this.years.forEach(year => {
        const x = this.xScale(year) + this.xScale.bandwidth() / 2;
        if (this.years.length > 20 && (year % 2 !== 0)) return; 
        p.text(year, x, this.chartH + 5);
      });
      p.textAlign(p.CENTER, p.TOP);
      p.text("Year", this.chartW / 2, this.chartH + 30);

      // Y-axis (Players)
      p.textAlign(p.RIGHT, p.CENTER);
      this.playerList.forEach(player => {
        const y = this.yScale(player) + this.yScale.bandwidth() / 2;
        p.text(player, -5, y);
      });
      p.push();
      p.translate(-this.margin.left + 20, this.chartH / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Player", 0, 0);
      p.pop();
    },

    drawLegend(p) {
        if (!this.colorScale) return;
        
        const x0 = this.chartW + 20;
        const y0 = 120;
        const w = 20;
        const h = 160;
        const steps = 40;
        
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        p.fill(40);
        p.text("Avg. GWR (%)", x0, y0 - 20);

        for (let i = 0; i <= steps; i++) {
            const v = p.map(i, 0, steps, 0.5, 0.75); 
            const y = p.map(v, 0.5, 0.75, y0 + h, y0);
            p.noStroke();
            p.fill(this.colorScale(v));
            p.rect(x0, y, w, h / steps + 0.5);
        }
        
        // Axis ticks
        p.fill(40);
        p.textAlign(p.LEFT, p.CENTER);
        for (const val of [0.50, 0.55, 0.60, 0.65, 0.70, 0.75]) {
             const y = p.map(val, 0.5, 0.75, y0 + h, y0);
             p.text(`${p.nf(val * 100, 0, 0)}`, x0 + w + 5, y);
             p.stroke(40);
             p.line(x0 + w, y, x0 + w + 3, y);
        }
    },

    drawSurfaceSelector: function(p, manager) {
        const x0 = this.chartW / 2 - 100;
        const y0 = -60;
        const buttonW = 60;
        const buttonH = 25;
        const spacing = 10;
        
        p.textSize(12);
        p.textAlign(p.LEFT, p.CENTER);
        p.fill(40);
        p.text("Surface:", x0 - 50, y0 + buttonH / 2);

        this.surfaces.forEach((surface, i) => {
            const x = x0 + i * (buttonW + spacing);
            
            // Draw button background
            if (surface === this.currentSurface) {
                p.fill(30, 115, 190);
                p.noStroke();
            } else {
                p.fill(220);
                p.stroke(180);
            }
            p.rect(x, y0, buttonW, buttonH, 4);

            // Draw button text
            p.fill(surface === this.currentSurface ? 255 : 40);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(surface, x + buttonW / 2, y0 + buttonH / 2);
            
            manager._rq3b_selectors = manager._rq3b_selectors || {};
            manager._rq3b_selectors[surface] = {x: x + this.margin.left, y: y0 + this.margin.top, w: buttonW, h: buttonH, surface: surface};
        });
    },

    drawTooltip: function (p, sx, sy, lines) {
      const padding = 6;
      p.textSize(11);
      
      let w = 0;
      for (const line of lines) {
        w = p.max(w, p.textWidth(line));
      }
      
      const h = lines.length * 15 + padding * 2;
      w += padding * 2;
      
      // Adjust position to keep it on screen
      let x = sx + 10;
      let y = sy;
      if (x + w > this.chartW) {
        x = sx - w - 10;
      }
      if (y + h > this.chartH) {
        y = this.chartH - h;
      }

      // Draw box
      p.fill(255, 250);
      p.stroke(40);
      p.strokeWeight(1);
      p.rect(x, y, w, h, 4);

      // Tooltip text
      p.noStroke();
      p.fill(40);
      p.textAlign(p.LEFT, p.TOP);
      let ty = y + padding;
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
          p.textStyle(p.BOLD);
        } else {
          p.textStyle(p.NORMAL);
        }
        p.text(lines[i], x + padding, ty);
        ty += 15;
      }
    },

    checkHover: function (p) {
      if (!this.xScale || !this.yScale) return;

      // Mouse position relative to chart area
      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;
      
      let hovered = null;
      
      const year = this.years.find(y => {
        const xStart = this.xScale(y);
        const xEnd = xStart + this.xScale.bandwidth();
        return mx >= xStart && mx < xEnd;
      });
      
      const player = this.playerList.find(pName => {
        const yStart = this.yScale(pName);
        const yEnd = yStart + this.yScale.bandwidth();
        return my >= yStart && my < yEnd;
      });
      
      if (year && player) {
        hovered = this.allData.find(d => 
          d.year == year &&
          d.player === player && 
          d.surface === this.currentSurface
        );
      }

      this.hoverCell = hovered;
    },
    
    handleClick: function (p, manager) {
      if (!manager._rq3b_selectors) return false;
      
      for (const key in manager._rq3b_selectors) {
        const area = manager._rq3b_selectors[key];
        if (p.mouseX > area.x && p.mouseX < area.x + area.w &&
            p.mouseY > area.y && p.mouseY < area.y + area.h) {
          this.currentSurface = area.surface;
          this.initScales(p);
          return true; 
        }
      }
      return false;
    }
  };

  // Expose the visualization object globally
  window.Viz_RQ3_b = {
      draw: Viz.draw.bind(Viz),
      handleClick: Viz.handleClick.bind(Viz),
      setData: function(manager) {
          manager._rq3b_selectors = manager._rq3b_selectors || {};
      }
  };

})();