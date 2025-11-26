// // Viz_RQ2_RanksSlams.js
// // Visualization for RQ2: Big 3 ATP Year-end Rankings and Grand Slam Wins
// (function () {
//  const Viz = {
//    table: null,
//    players: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//    colors: {},
//    margin: { top: 60, right: 200, bottom: 60, left: 80 },
//    chartW: 0,
//    chartH: 0,
//    yearMin: null,
//    yearMax: null,
//    rankMin: null,
//    rankMax: null,
//    points: [],
//    initialized: false,
//    RANK_CUTOFF: 20,
//    highlightedPlayer: null,  // NEW: for interactive filtering

//    ensureInit(p) {
//      if (this.initialized) return;
//      this.chartW = p.width - this.margin.left - this.margin.right;
//      this.chartH = p.height - this.margin.top - this.margin.bottom;

//      // colors for Big 3 - same as before
//      this.colors["Roger Federer"]  = p.color(2, 131, 131);
//      this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
//      this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//      // load the CSV once
//      if (!this.table) {
//        this.table = p.loadTable(
//          "data/processed/rankings_slams.csv",
//          "csv",
//          "header",
//          (t) => {
//            this.table = t;
//            this.computeRanges();
//          }
//        );
//      }
//      this.initialized = true;
//    },

//    computeRanges() {
//      if (!this.table || this.table.getRowCount() === 0) return;

//      const years = [];
//      for (let r = 0; r < this.table.getRowCount(); r++) {
//        years.push(parseInt(this.table.getString(r, "year")));
//      }
//      this.yearMin = Math.min(...years);
//      this.yearMax = Math.max(...years);

//      this.rankMin = 1;
//      this.rankMax = this.RANK_CUTOFF;
//    },

//    draw(p, manager, ai, progress) {
//      this.ensureInit(p);
//      if (!this.table || this.yearMin === null) {
//        p.background(240);
//        p.fill(80);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.noStroke();
//        p.text("Loading rankings_slams.csv ...", p.width / 2, p.height / 2);
//        return;
//      }

//      p.background(240);  // Light background
//      this.points = [];

//      this.drawAxes(p);

//      // Draw all player lines
//      for (let name of this.players) {
//        this.drawPlayerLine(p, name);
//      }

//      this.drawLegend(p);
//      this.drawSlamsMiniChart(p);
//      this.drawTooltip(p);
//    },

//    drawAxes(p) {
//      p.push();
//      p.translate(this.margin.left, this.margin.top);
     
//      // Grid lines - lighter
//      p.stroke(200);
//      p.strokeWeight(1);

//      // x-axis
//      p.stroke(100);
//      p.line(0, this.chartH, this.chartW, this.chartH);
     
//      for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//        let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//        p.stroke(100);
//        p.line(x, this.chartH, x, this.chartH + 5);
       
//        p.textSize(10);
//        p.noStroke();
//        p.fill(80);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.text(y, x, this.chartH + 20);
       
//        // Vertical grid - very light
//        p.stroke(220);
//        p.line(x, 0, x, this.chartH);
//      }

//      // y-axis
//      p.stroke(100);
//      p.line(0, 0, 0, this.chartH);
//      p.textAlign(p.RIGHT, p.CENTER);

//      for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//        let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);
//        p.stroke(100);
//        p.line(-5, y, 0, y);
       
//        p.noStroke();
//        p.textSize(10);
//        p.fill(80);
//        p.text(r, -10, y);
       
//        // Horizontal grid - very light
//        p.stroke(220);
//        p.line(0, y, this.chartW, y);
//      }

//      // Axis labels
//      p.noStroke();
//      p.textAlign(p.CENTER);
//      p.textSize(12);
//      p.fill(60);
//      p.text("Year", this.chartW / 2, this.chartH + 45);

//      p.push();
//      p.translate(-50, this.chartH / 2);
//      p.rotate(-p.HALF_PI);
//      p.text("Year-end ATP Ranking (lower is better)", 0, 0);
//      p.pop();

//      // Title
//      p.textSize(16);
//      p.fill(40);
//      p.text(
//        "Big 3 ATP Year-end Rankings and Grand Slam Wins",
//        this.chartW / 2,
//        -30
//      );

//      p.pop();
//    },

//    drawPlayerLine(p, playerName) {
//      const rows = [];
//      for (let r = 0; r < this.table.getRowCount(); r++) {
//        if (this.table.getString(r, "player_name") === playerName) {
//          rows.push(this.table.getRow(r));
//        }
//      }

//      rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//      const pts = [];
//      for (let row of rows) {
//        const year = parseInt(row.get("year"));
//        const rankStr = row.get("rank");
//        const trueRank = parseInt(rankStr);
//        if (Number.isNaN(trueRank)) continue;

//        const slamsStr = row.get("slam_wins");
//        const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//        const slamNames = row.get("slam_names");

//        const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//        const isClipped = trueRank > this.rankMax;
//        const rankForPlot = isClipped ? this.rankMax : trueRank;
//        const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//        pts.push({
//          x, y, year,
//          rank: trueRank,
//          slams,
//          slamNames,
//          player: playerName,
//          isClipped
//        });
//      }

//      p.push();
//      p.translate(this.margin.left, this.margin.top);

//      // Check if this player should be dimmed
//      const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//      const c = this.colors[playerName];

//      // Ranking line
//      if (isDimmed) {
//        p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//        p.strokeWeight(1);
//      } else {
//        p.stroke(c);
//        p.strokeWeight(2.5);
//      }
     
//      p.noFill();
//      p.beginShape();
//      for (let pt of pts) {
//        p.vertex(pt.x, pt.y);
//      }
//      p.endShape();

//      // Draw points
//      for (let pt of pts) {
//        const baseRadius = pt.slams > 0 ? 5 : 2;
//        const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//        const r = baseRadius + extra;

//        if (pt.isClipped) {
//          // Triangle at bottom for rank > 20
//          const bottomY = this.chartH;
//          const triSize = 6;
//          p.noStroke();
//          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//          p.triangle(
//            pt.x, bottomY + triSize,
//            pt.x - triSize / 2, bottomY,
//            pt.x + triSize / 2, bottomY
//          );
//        } else if (pt.slams > 0) {
//          // Slam year: emphasized point
//          if (!isDimmed) {
//            p.noStroke();
//            p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//            p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//          }

//          p.stroke(255);
//          p.strokeWeight(2);
//          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//          p.ellipse(pt.x, pt.y, r * 2, r * 2);
//        } else {
//          // Non-slam year
//          p.noStroke();
//          p.fill(isDimmed ? 
//            p.color(c.levels[0], c.levels[1], c.levels[2], 60) :
//            p.color(c.levels[0], c.levels[1], c.levels[2], 180));
//          p.ellipse(pt.x, pt.y, r * 2, r * 2);
//        }

//        this.points.push({
//          ...pt,
//          screenX: pt.x + this.margin.left,
//          screenY: pt.y + this.margin.top,
//          radius: r
//        });
//      }

//      p.pop();
//    },

//    drawLegend(p) {
//      p.push();
//      const x0 = p.width - this.margin.right + 20;
//      const y0 = this.margin.top;

//      p.textAlign(p.LEFT, p.CENTER);
//      p.textSize(11);
//      p.noStroke();
//      p.fill(60);
//      p.text("Players (click to highlight)", x0, y0);

//      let i = 1;
//      for (let name of this.players) {
//        const yy = y0 + i * 24;
//        const isHighlighted = this.highlightedPlayer === name;
//        const isClickable = p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
//                           p.mouseY > yy - 10 && p.mouseY < yy + 10;

//        // Hover background
//        if (isClickable) {
//          p.fill(230);
//          p.noStroke();
//          p.rect(x0 - 15, yy - 10, 150, 20, 3);
//        }

//        // Color dot
//        p.fill(this.colors[name]);
//        p.ellipse(x0 - 5, yy, 10, 10);
       
//        // Player name
//        p.fill(isHighlighted ? 40 : 80);
//        p.textSize(11);
//        p.text(name, x0 + 8, yy);

//        // Highlight indicator
//        if (isHighlighted) {
//          p.fill(40);
//          p.textSize(9);
//          p.text("★", x0 + 120, yy);
//        }

//        i++;
//      }

//      // Legend info
//      const infoY = y0 + i * 24 + 10;
//      p.textSize(10);
//      p.fill(100);
//      p.text("● = Slam year", x0, infoY);
//      p.text("▼ = Rank > 20", x0, infoY + 15);

//      // Reset button if someone is highlighted
//      if (this.highlightedPlayer) {
//        const resetY = infoY + 40;
//        const resetW = 100;
//        const resetH = 24;
//        const resetX = x0;
       
//        const isHovering = p.mouseX > resetX && p.mouseX < resetX + resetW &&
//                          p.mouseY > resetY && p.mouseY < resetY + resetH;
       
//        p.fill(isHovering ? 180 : 200);
//        p.stroke(140);
//        p.strokeWeight(1);
//        p.rect(resetX, resetY, resetW, resetH, 3);
       
//        p.noStroke();
//        p.fill(60);
//        p.textSize(10);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//      }

//      p.pop();
//    },

//    drawSlamsMiniChart(p) {
//      if (!this.table) return;

//      const panelX = p.width - this.margin.right + 10;
//      const panelY = this.margin.top + 150;
//      const panelW = this.margin.right - 30;
//      const panelH = 180;

//      p.push();
//      p.translate(panelX, panelY);

//      // Panel background - lighter
//      p.noStroke();
//      p.fill(255);
//      p.stroke(200);
//      p.strokeWeight(1);
//      p.rect(0, 0, panelW, panelH, 4);

//      p.noStroke();
//      p.fill(60);
//      p.textAlign(p.CENTER, p.TOP);
//      p.textSize(10);
//      p.text("Slams by Year", panelW / 2, 8);

//      const innerPadL = 35;
//      const innerPadR = 8;
//      const innerPadTop = 28;
//      const innerPadBottom = 15;

//      const innerW = panelW - innerPadL - innerPadR;
//      const innerH = panelH - innerPadTop - innerPadBottom;

//      // Player rows
//      const playerY = {};
//      const stepY = innerH / (this.players.length + 1);

//      p.textAlign(p.RIGHT, p.CENTER);
//      p.textSize(9);
//      for (let i = 0; i < this.players.length; i++) {
//        const name = this.players[i];
//        const y = innerPadTop + stepY * (i + 1);
//        playerY[name] = y;
//        const lastName = name.split(" ").slice(-1)[0];
       
//        const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== name;
//        p.fill(isDimmed ? 180 : 80);
//        p.text(lastName, innerPadL - 6, y);
//      }

//      // Axis line
//      p.stroke(180);
//      p.strokeWeight(1);
//      p.line(innerPadL, innerPadTop, innerPadL, innerPadTop + innerH);

//      // Slam circles
//      for (let r = 0; r < this.table.getRowCount(); r++) {
//        const row = this.table.getRow(r);
//        const player = row.get("player_name");
//        if (!(player in playerY)) continue;

//        const slamsStr = row.get("slam_wins");
//        const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//        if (!slams || slams <= 0) continue;

//        const year = parseInt(row.get("year"));
//        const x = p.map(year, this.yearMin, this.yearMax,
//          innerPadL + 4, innerPadL + innerW - 4);
//        const y = playerY[player];

//        const size = 4 + Math.min(slams, 3) * 2;
//        const col = this.colors[player];
       
//        const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== player;

//        // Glow effect
//        if (!isDimmed) {
//          p.noStroke();
//          p.fill(col.levels[0], col.levels[1], col.levels[2], 40);
//          p.ellipse(x, y, size + 6, size + 6);
//        }

//        // Main circle
//        p.stroke(col);
//        p.strokeWeight(1.5);
//        p.fill(isDimmed ? 220 : 240);
//        p.ellipse(x, y, size, size);
//      }

//      // Year ticks
//      p.textAlign(p.CENTER, p.TOP);
//      p.textSize(8);
//      p.noStroke();
//      p.fill(120);
//      const tickStep = Math.max(2, Math.round((this.yearMax - this.yearMin) / 4));
//      for (let y = this.yearMin; y <= this.yearMax; y += tickStep) {
//        const xTick = p.map(y, this.yearMin, this.yearMax,
//          innerPadL + 4, innerPadL + innerW - 4);
//        p.text(y, xTick, innerPadTop + innerH + 3);
//      }

//      p.pop();
//    },

//    drawTooltip(p) {
//      let hovered = null;
//      for (let pt of this.points) {
//        const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//        if (d <= pt.radius + 6) {
//          hovered = pt;
//          break;
//        }
//      }
//      if (!hovered) return;

//      const lines = [];
//      lines.push(hovered.player);
//      lines.push("Year: " + hovered.year);

//      let rankLine = "Rank: " + hovered.rank;
//      if (hovered.isClipped) {
//        rankLine += " (worse than #20)";
//      }
//      lines.push(rankLine);

//      if (hovered.slams > 0) {
//        lines.push("Slams: " + hovered.slams);
//        lines.push(hovered.slamNames);
//      } else {
//        lines.push("No Slams this year");
//      }

//      const padding = 8;
//      p.textSize(10);
//      let w = 0;
//      for (let t of lines) {
//        w = Math.max(w, p.textWidth(t));
//      }
//      const h = lines.length * 15;

//      let x = hovered.screenX + 15;
//      let y = hovered.screenY - h - 15;
//      if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//      if (y < 0) y = hovered.screenY + 15;

//      // Tooltip background
//      p.fill(255);
//      p.stroke(150);
//      p.strokeWeight(1);
//      p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//      // Tooltip text
//      p.noStroke();
//      p.fill(40);
//      p.textAlign(p.LEFT, p.TOP);
//      let ty = y + padding;
//      for (let i = 0; i < lines.length; i++) {
//        if (i === 0) {
//          p.textStyle(p.BOLD);
//        } else {
//          p.textStyle(p.NORMAL);
//        }
//        p.text(lines[i], x + padding, ty);
//        ty += 15;
//      }
//    },

//    handleClick(p) {
//      // Check legend clicks
//      const x0 = p.width - this.margin.right + 20;
//      const y0 = this.margin.top;

//      for (let i = 0; i < this.players.length; i++) {
//        const name = this.players[i];
//        const yy = y0 + (i + 1) * 24;
       
//        if (p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
//            p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//          this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//          return true;
//        }
//      }

//      // Check reset button
//      if (this.highlightedPlayer) {
//        const infoY = y0 + (this.players.length + 1) * 24 + 10;
//        const resetY = infoY + 40;
//        const resetX = x0;
//        const resetW = 100;
//        const resetH = 24;
       
//        if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//            p.mouseY > resetY && p.mouseY < resetY + resetH) {
//          this.highlightedPlayer = null;
//          return true;
//        }
//      }

//      return false;
//    }
//  };

//  window.Viz_RQ2_RanksSlams = Viz;
// })();






// Viz_RQ2_RanksSlams.js
// Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
// (function () {
//  const Viz = {
//    currentGender: "men",  // NEW: toggle between "men" and "women"
//    menTable: null,
//    womenTable: null,
   
//    // Players for each gender
//    menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//    womenPlayers: ["Serena Williams", "Venus Williams", "Maria Sharapova"],  // UPDATE with your actual players
   
//    colors: {},
//    margin: { top: 60, right: 200, bottom: 60, left: 80 },
//    chartW: 0,
//    chartH: 0,
//    yearMin: null,
//    yearMax: null,
//    rankMin: null,
//    rankMax: null,
//    points: [],
//    initialized: false,
//    RANK_CUTOFF: 20,
//    highlightedPlayer: null,

//    ensureInit(p) {
//      if (this.initialized) return;
//      this.chartW = p.width - this.margin.left - this.margin.right;
//      this.chartH = p.height - this.margin.top - this.margin.bottom;

//      // Colors for men (Big 3)
//      this.colors["Roger Federer"]  = p.color(2, 131, 131);
//      this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
//      this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//      // Colors for women - UPDATE these with your actual player names
//      this.colors["Serena Williams"] = p.color(255, 105, 180);  // Pink
//      this.colors["Venus Williams"] = p.color(147, 51, 234);    // Purple
//      this.colors["Maria Sharapova"] = p.color(34, 197, 94);    // Green

//      // Load both CSV files
//      if (!this.menTable) {
//        this.menTable = p.loadTable(
//          "data/processed/rankings_slams.csv",
//          "csv",
//          "header",
//          (t) => {
//            this.menTable = t;
//            this.computeRanges();
//          }
//        );
//      }
     
//      if (!this.womenTable) {
//        this.womenTable = p.loadTable(
//          "data/processed/rankings_slams_WTA.csv",  // UPDATE with your actual filename
//          "csv",
//          "header",
//          (t) => {
//            this.womenTable = t;
//            this.computeRanges();
//          }
//        );
//      }
     
//      this.initialized = true;
//    },

//    // Get current active table and players
//    getCurrentData() {
//      return {
//        table: this.currentGender === "men" ? this.menTable : this.womenTable,
//        players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
//      };
//    },

//    computeRanges() {
//      const { table } = this.getCurrentData();
//      if (!table || table.getRowCount() === 0) return;

//      const years = [];
//      for (let r = 0; r < table.getRowCount(); r++) {
//        years.push(parseInt(table.getString(r, "year")));
//      }
//      this.yearMin = Math.min(...years);
//      this.yearMax = Math.max(...years);

//      this.rankMin = 1;
//      this.rankMax = this.RANK_CUTOFF;
//    },

//    draw(p, manager, ai, progress) {
//      this.ensureInit(p);
     
//      const { table } = this.getCurrentData();
     
//      if (!table || this.yearMin === null) {
//        p.background(240);
//        p.fill(80);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.noStroke();
//        p.text("Loading data...", p.width / 2, p.height / 2);
//        return;
//      }

//      p.background(240);
//      this.points = [];

//      this.drawGenderToggle(p);  // NEW: Draw toggle button
//      this.drawAxes(p);

//      const { players } = this.getCurrentData();
//      for (let name of players) {
//        this.drawPlayerLine(p, name);
//      }

//      this.drawLegend(p);
//      this.drawSlamsMiniChart(p);
//      this.drawTooltip(p);
//    },

//    // NEW: Draw gender toggle button
//    drawGenderToggle(p) {
//      const toggleX = p.width / 2 - 80;
//      const toggleY = 15;
//      const toggleW = 160;
//      const toggleH = 32;
     
//      p.push();
     
//      const isHovering = p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//                        p.mouseY > toggleY && p.mouseY < toggleY + toggleH;
     
//      // Toggle background
//      if (this.currentGender === "men") {
//        p.fill(isHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
//      } else {
//        p.fill(isHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
//      }
//      p.noStroke();
//      p.rect(toggleX, toggleY, toggleW, toggleH, 4);
     
//      // Toggle label
//      p.fill(255);
//      p.textSize(13);
//      p.textAlign(p.CENTER, p.CENTER);
//      const label = this.currentGender === "men" ? "MEN'S ATP" : "WOMEN'S WTA";
//      p.text(label, toggleX + toggleW / 2, toggleY + toggleH / 2);
     
//      p.pop();
//    },

//    drawAxes(p) {
//      p.push();
//      p.translate(this.margin.left, this.margin.top);
     
//      p.stroke(200);
//      p.strokeWeight(1);

//      // x-axis
//      p.stroke(100);
//      p.line(0, this.chartH, this.chartW, this.chartH);
     
//      for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//        let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//        p.stroke(100);
//        p.line(x, this.chartH, x, this.chartH + 5);
       
//        p.textSize(10);
//        p.noStroke();
//        p.fill(80);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.text(y, x, this.chartH + 20);
       
//        p.stroke(220);
//        p.line(x, 0, x, this.chartH);
//      }

//      // y-axis
//      p.stroke(100);
//      p.line(0, 0, 0, this.chartH);
//      p.textAlign(p.RIGHT, p.CENTER);

//      for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//        let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);
//        p.stroke(100);
//        p.line(-5, y, 0, y);
       
//        p.noStroke();
//        p.textSize(10);
//        p.fill(80);
//        p.text(r, -10, y);
       
//        p.stroke(220);
//        p.line(0, y, this.chartW, y);
//      }

//      // Axis labels
//      p.noStroke();
//      p.textAlign(p.CENTER);
//      p.textSize(12);
//      p.fill(60);
//      p.text("Year", this.chartW / 2, this.chartH + 45);

//      p.push();
//      p.translate(-50, this.chartH / 2);
//      p.rotate(-p.HALF_PI);
//      const axisLabel = this.currentGender === "men" ? 
//        "Year-end ATP Ranking (lower is better)" : 
//        "Year-end WTA Ranking (lower is better)";
//      p.text(axisLabel, 0, 0);
//      p.pop();

//      // Title
//      p.textSize(16);
//      p.fill(40);
//      const titleLabel = this.currentGender === "men" ? 
//        "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
//        "WTA Year-end Rankings and Grand Slam Wins";
//      p.text(titleLabel, this.chartW / 2, -30);

//      p.pop();
//    },

//    drawPlayerLine(p, playerName) {
//      const { table } = this.getCurrentData();
     
//      const rows = [];
//      for (let r = 0; r < table.getRowCount(); r++) {
//        if (table.getString(r, "player_name") === playerName) {
//          rows.push(table.getRow(r));
//        }
//      }

//      rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//      const pts = [];
//      for (let row of rows) {
//        const year = parseInt(row.get("year"));
//        const rankStr = row.get("rank");
//        const trueRank = parseInt(rankStr);
//        if (Number.isNaN(trueRank)) continue;

//        const slamsStr = row.get("slam_wins");
//        const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//        const slamNames = row.get("slam_names");

//        const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//        const isClipped = trueRank > this.rankMax;
//        const rankForPlot = isClipped ? this.rankMax : trueRank;
//        const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//        pts.push({
//          x, y, year,
//          rank: trueRank,
//          slams,
//          slamNames,
//          player: playerName,
//          isClipped
//        });
//      }

//      p.push();
//      p.translate(this.margin.left, this.margin.top);

//      const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//      const c = this.colors[playerName];

//      // Ranking line
//      if (isDimmed) {
//        p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//        p.strokeWeight(1);
//      } else {
//        p.stroke(c);
//        p.strokeWeight(2.5);
//      }
     
//      p.noFill();
//      p.beginShape();
//      for (let pt of pts) {
//        p.vertex(pt.x, pt.y);
//      }
//      p.endShape();

//      // Draw points
//      for (let pt of pts) {
//        const baseRadius = pt.slams > 0 ? 5 : 2;
//        const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//        const r = baseRadius + extra;

//        if (pt.isClipped) {
//          const bottomY = this.chartH;
//          const triSize = 6;
//          p.noStroke();
//          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//          p.triangle(
//            pt.x, bottomY + triSize,
//            pt.x - triSize / 2, bottomY,
//            pt.x + triSize / 2, bottomY
//          );
//        } else if (pt.slams > 0) {
//          if (!isDimmed) {
//            p.noStroke();
//            p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//            p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//          }

//          p.stroke(255);
//          p.strokeWeight(2);
//          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//          p.ellipse(pt.x, pt.y, r * 2, r * 2);
//        } else {
//          p.noStroke();
//          p.fill(isDimmed ? 
//            p.color(c.levels[0], c.levels[1], c.levels[2], 60) :
//            p.color(c.levels[0], c.levels[1], c.levels[2], 180));
//          p.ellipse(pt.x, pt.y, r * 2, r * 2);
//        }

//        this.points.push({
//          ...pt,
//          screenX: pt.x + this.margin.left,
//          screenY: pt.y + this.margin.top,
//          radius: r
//        });
//      }

//      p.pop();
//    },

//    drawLegend(p) {
//      p.push();
//      const x0 = p.width - this.margin.right + 20;
//      const y0 = this.margin.top;

//      const { players } = this.getCurrentData();

//      p.textAlign(p.LEFT, p.CENTER);
//      p.textSize(11);
//      p.noStroke();
//      p.fill(60);
//      p.text("Players (click to highlight)", x0, y0);

//      let i = 1;
//      for (let name of players) {
//        const yy = y0 + i * 24;
//        const isHighlighted = this.highlightedPlayer === name;
//        const isClickable = p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
//                           p.mouseY > yy - 10 && p.mouseY < yy + 10;

//        if (isClickable) {
//          p.fill(230);
//          p.noStroke();
//          p.rect(x0 - 15, yy - 10, 150, 20, 3);
//        }

//        p.fill(this.colors[name]);
//        p.ellipse(x0 - 5, yy, 10, 10);
       
//        p.fill(isHighlighted ? 40 : 80);
//        p.textSize(11);
//        p.text(name, x0 + 8, yy);

//        if (isHighlighted) {
//          p.fill(40);
//          p.textSize(9);
//          p.text("★", x0 + 120, yy);
//        }

//        i++;
//      }

//      const infoY = y0 + i * 24 + 10;
//      p.textSize(10);
//      p.fill(100);
//      p.text("● = Slam year", x0, infoY);
//      p.text("▼ = Rank > 20", x0, infoY + 15);

//      if (this.highlightedPlayer) {
//        const resetY = infoY + 40;
//        const resetW = 100;
//        const resetH = 24;
//        const resetX = x0;
       
//        const isHovering = p.mouseX > resetX && p.mouseX < resetX + resetW &&
//                          p.mouseY > resetY && p.mouseY < resetY + resetH;
       
//        p.fill(isHovering ? 180 : 200);
//        p.stroke(140);
//        p.strokeWeight(1);
//        p.rect(resetX, resetY, resetW, resetH, 3);
       
//        p.noStroke();
//        p.fill(60);
//        p.textSize(10);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//      }

//      p.pop();
//    },

//    drawSlamsMiniChart(p) {
//      const { table, players } = this.getCurrentData();
//      if (!table) return;

//      const panelX = p.width - this.margin.right + 10;
//      const panelY = this.margin.top + 150;
//      const panelW = this.margin.right - 30;
//      const panelH = 180;

//      p.push();
//      p.translate(panelX, panelY);

//      p.noStroke();
//      p.fill(255);
//      p.stroke(200);
//      p.strokeWeight(1);
//      p.rect(0, 0, panelW, panelH, 4);

//      p.noStroke();
//      p.fill(60);
//      p.textAlign(p.CENTER, p.TOP);
//      p.textSize(10);
//      p.text("Slams by Year", panelW / 2, 8);

//      const innerPadL = 35;
//      const innerPadR = 8;
//      const innerPadTop = 28;
//      const innerPadBottom = 15;

//      const innerW = panelW - innerPadL - innerPadR;
//      const innerH = panelH - innerPadTop - innerPadBottom;

//      const playerY = {};
//      const stepY = innerH / (players.length + 1);

//      p.textAlign(p.RIGHT, p.CENTER);
//      p.textSize(9);
//      for (let i = 0; i < players.length; i++) {
//        const name = players[i];
//        const y = innerPadTop + stepY * (i + 1);
//        playerY[name] = y;
//        const lastName = name.split(" ").slice(-1)[0];
       
//        const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== name;
//        p.fill(isDimmed ? 180 : 80);
//        p.text(lastName, innerPadL - 6, y);
//      }

//      p.stroke(180);
//      p.strokeWeight(1);
//      p.line(innerPadL, innerPadTop, innerPadL, innerPadTop + innerH);

//      for (let r = 0; r < table.getRowCount(); r++) {
//        const row = table.getRow(r);
//        const player = row.get("player_name");
//        if (!(player in playerY)) continue;

//        const slamsStr = row.get("slam_wins");
//        const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//        if (!slams || slams <= 0) continue;

//        const year = parseInt(row.get("year"));
//        const x = p.map(year, this.yearMin, this.yearMax,
//          innerPadL + 4, innerPadL + innerW - 4);
//        const y = playerY[player];

//        const size = 4 + Math.min(slams, 3) * 2;
//        const col = this.colors[player];
       
//        const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== player;

//        if (!isDimmed) {
//          p.noStroke();
//          p.fill(col.levels[0], col.levels[1], col.levels[2], 40);
//          p.ellipse(x, y, size + 6, size + 6);
//        }

//        p.stroke(col);
//        p.strokeWeight(1.5);
//        p.fill(isDimmed ? 220 : 240);
//        p.ellipse(x, y, size, size);
//      }

//      p.textAlign(p.CENTER, p.TOP);
//      p.textSize(8);
//      p.noStroke();
//      p.fill(120);
//      const tickStep = Math.max(2, Math.round((this.yearMax - this.yearMin) / 4));
//      for (let y = this.yearMin; y <= this.yearMax; y += tickStep) {
//        const xTick = p.map(y, this.yearMin, this.yearMax,
//          innerPadL + 4, innerPadL + innerW - 4);
//        p.text(y, xTick, innerPadTop + innerH + 3);
//      }

//      p.pop();
//    },

//    drawTooltip(p) {
//      let hovered = null;
//      for (let pt of this.points) {
//        const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//        if (d <= pt.radius + 6) {
//          hovered = pt;
//          break;
//        }
//      }
//      if (!hovered) return;

//      const lines = [];
//      lines.push(hovered.player);
//      lines.push("Year: " + hovered.year);

//      let rankLine = "Rank: " + hovered.rank;
//      if (hovered.isClipped) {
//        rankLine += " (worse than #20)";
//      }
//      lines.push(rankLine);

//      if (hovered.slams > 0) {
//        lines.push("Slams: " + hovered.slams);
//        lines.push(hovered.slamNames);
//      } else {
//        lines.push("No Slams this year");
//      }

//      const padding = 8;
//      p.textSize(10);
//      let w = 0;
//      for (let t of lines) {
//        w = Math.max(w, p.textWidth(t));
//      }
//      const h = lines.length * 15;

//      let x = hovered.screenX + 15;
//      let y = hovered.screenY - h - 15;
//      if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//      if (y < 0) y = hovered.screenY + 15;

//      p.fill(255);
//      p.stroke(150);
//      p.strokeWeight(1);
//      p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//      p.noStroke();
//      p.fill(40);
//      p.textAlign(p.LEFT, p.TOP);
//      let ty = y + padding;
//      for (let i = 0; i < lines.length; i++) {
//        if (i === 0) {
//          p.textStyle(p.BOLD);
//        } else {
//          p.textStyle(p.NORMAL);
//        }
//        p.text(lines[i], x + padding, ty);
//        ty += 15;
//      }
//    },

//    handleClick(p) {
//      // Check gender toggle click
//      const toggleX = p.width / 2 - 80;
//      const toggleY = 15;
//      const toggleW = 160;
//      const toggleH = 32;
     
//      if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//          p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
//        this.currentGender = this.currentGender === "men" ? "women" : "men";
//        this.highlightedPlayer = null;  // Reset highlight when switching
//        this.computeRanges();  // Recompute for new data
//        return true;
//      }

//      // Check legend clicks
//      const x0 = p.width - this.margin.right + 20;
//      const y0 = this.margin.top;
//      const { players } = this.getCurrentData();

//      for (let i = 0; i < players.length; i++) {
//        const name = players[i];
//        const yy = y0 + (i + 1) * 24;
       
//        if (p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
//            p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//          this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//          return true;
//        }
//      }

//      // Check reset button
//      if (this.highlightedPlayer) {
//        const infoY = y0 + (players.length + 1) * 24 + 10;
//        const resetY = infoY + 40;
//        const resetX = x0;
//        const resetW = 100;
//        const resetH = 24;
       
//        if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//            p.mouseY > resetY && p.mouseY < resetY + resetH) {
//          this.highlightedPlayer = null;
//          return true;
//        }
//      }

//      return false;
//    }
//  };

//  window.Viz_RQ2_RanksSlams = Viz;
// })();






// Viz_RQ2_RanksSlams.js
// Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
// (function () {
//  const Viz = {
//    currentGender: "men",  // toggle between "men" and "women"
//    menTable: null,
//    womenTable: null,
   
//    // Players for each gender - UPDATE THESE WITH YOUR ACTUAL PLAYERS
//    menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//    womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],  // UPDATE
   
//    colors: {},
//    margin: { top: 60, right: 200, bottom: 60, left: 80 },
//    chartW: 0,
//    chartH: 0,
//    yearMin: null,
//    yearMax: null,
//    rankMin: null,
//    rankMax: null,
//    points: [],
//    initialized: false,
//    RANK_CUTOFF: 20,
//    highlightedPlayer: null,

//    ensureInit(p) {
//      if (this.initialized) return;
//      this.chartW = p.width - this.margin.left - this.margin.right;
//      this.chartH = p.height - this.margin.top - this.margin.bottom;

//      // Colors for men (Big 3)
//      this.colors["Roger Federer"]  = p.color(2, 131, 131);
//      this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
//      this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//      // Colors for women - UPDATE WITH YOUR ACTUAL PLAYER NAMES
//      this.colors["Serena Williams"] = p.color(255, 105, 180);
//      this.colors["Iga Swiatek"] = p.color(147, 51, 234);
//      this.colors["Justine Henin"] = p.color(34, 197, 94);

//      // Load both CSV files
//      if (!this.menTable) {
//        p.loadTable(
//          "data/processed/rankings_slams.csv",
//          "csv",
//          "header",
//          (t) => {
//            this.menTable = t;
//            this.computeRanges();
//          }
//        );
//      }
     
//      if (!this.womenTable) {
//        p.loadTable(
//          "data/processed/women_rankings_slams.csv",  // UPDATE FILENAME
//          "csv",
//          "header",
//          (t) => {
//            this.womenTable = t;
//            this.computeRanges();
//          }
//        );
//      }
     
//      this.initialized = true;
//    },

//    getCurrentData() {
//      return {
//        table: this.currentGender === "men" ? this.menTable : this.womenTable,
//        players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
//      };
//    },

//    computeRanges() {
//      const { table } = this.getCurrentData();
//      if (!table || table.getRowCount() === 0) return;

//      const years = [];
//      for (let r = 0; r < table.getRowCount(); r++) {
//        const yearVal = table.getString(r, "year");
//        if (yearVal) years.push(parseInt(yearVal));
//      }
     
//      if (years.length > 0) {
//        this.yearMin = Math.min(...years);
//        this.yearMax = Math.max(...years);
//      }

//      this.rankMin = 1;
//      this.rankMax = this.RANK_CUTOFF;
//    },

//    draw(p, manager, ai, progress) {
//      this.ensureInit(p);
     
//      const { table } = this.getCurrentData();
     
//      if (!table || this.yearMin === null) {
//        p.background(240);
//        p.fill(80);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.noStroke();
//        p.text("Loading data...", p.width / 2, p.height / 2);
//        return;
//      }

//      p.background(240);
//      this.points = [];

//      this.drawAxes(p);

//      const { players } = this.getCurrentData();
//      for (let name of players) {
//        this.drawPlayerLine(p, name);
//      }

//      this.drawLegendAndToggle(p);  // Combined legend + toggle on side
//      this.drawTooltip(p);
//    },

//    drawAxes(p) {
//      p.push();
//      p.translate(this.margin.left, this.margin.top);
     
//      p.stroke(200);
//      p.strokeWeight(1);

//      // x-axis
//      p.stroke(100);
//      p.line(0, this.chartH, this.chartW, this.chartH);
     
//      for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//        let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//        p.stroke(100);
//        p.line(x, this.chartH, x, this.chartH + 5);
       
//        p.textSize(10);
//        p.noStroke();
//        p.fill(80);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.text(y, x, this.chartH + 20);
       
//        p.stroke(220);
//        p.line(x, 0, x, this.chartH);
//      }

//      // y-axis
//      p.stroke(100);
//      p.line(0, 0, 0, this.chartH);
//      p.textAlign(p.RIGHT, p.CENTER);

//      for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//        let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);
//        p.stroke(100);
//        p.line(-5, y, 0, y);
       
//        p.noStroke();
//        p.textSize(10);
//        p.fill(80);
//        p.text(r, -10, y);
       
//        p.stroke(220);
//        p.line(0, y, this.chartW, y);
//      }

//      // Axis labels
//      p.noStroke();
//      p.textAlign(p.CENTER);
//      p.textSize(12);
//      p.fill(60);
//      p.text("Year", this.chartW / 2, this.chartH + 45);

//      p.push();
//      p.translate(-50, this.chartH / 2);
//      p.rotate(-p.HALF_PI);
//      const axisLabel = this.currentGender === "men" ? 
//        "Year-end ATP Ranking (lower is better)" : 
//        "Year-end WTA Ranking (lower is better)";
//      p.text(axisLabel, 0, 0);
//      p.pop();

//      // Title
//      p.textSize(16);
//      p.fill(40);
//      const titleLabel = this.currentGender === "men" ? 
//        "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
//        "WTA Year-end Rankings and Grand Slam Wins";
//      p.text(titleLabel, this.chartW / 2, -30);

//      p.pop();
//    },

//    drawPlayerLine(p, playerName) {
//      const { table } = this.getCurrentData();
     
//      const rows = [];
//      for (let r = 0; r < table.getRowCount(); r++) {
//        if (table.getString(r, "player_name") === playerName) {
//          rows.push(table.getRow(r));
//        }
//      }

//      rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//      const pts = [];
//      for (let row of rows) {
//        const year = parseInt(row.get("year"));
//        const rankStr = row.get("rank");
//        const trueRank = parseInt(rankStr);
//        if (Number.isNaN(trueRank)) continue;

//        const slamsStr = row.get("slam_wins");
//        const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//        const slamNames = row.get("slam_names") || "";

//        const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//        const isClipped = trueRank > this.rankMax;
//        const rankForPlot = isClipped ? this.rankMax : trueRank;
//        const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//        pts.push({
//          x, y, year,
//          rank: trueRank,
//          slams,
//          slamNames,
//          player: playerName,
//          isClipped
//        });
//      }

//      p.push();
//      p.translate(this.margin.left, this.margin.top);

//      const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//      const c = this.colors[playerName];

//      // Ranking line
//      if (isDimmed) {
//        p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//        p.strokeWeight(1);
//      } else {
//        p.stroke(c);
//        p.strokeWeight(2.5);
//      }
     
//      p.noFill();
//      p.beginShape();
//      for (let pt of pts) {
//        p.vertex(pt.x, pt.y);
//      }
//      p.endShape();

//      // Draw points
//      for (let pt of pts) {
//        const baseRadius = pt.slams > 0 ? 5 : 2;
//        const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//        const r = baseRadius + extra;

//        if (pt.isClipped) {
//          const bottomY = this.chartH;
//          const triSize = 6;
//          p.noStroke();
//          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//          p.triangle(
//            pt.x, bottomY + triSize,
//            pt.x - triSize / 2, bottomY,
//            pt.x + triSize / 2, bottomY
//          );
//        } else if (pt.slams > 0) {
//          if (!isDimmed) {
//            p.noStroke();
//            p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//            p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//          }

//          p.stroke(255);
//          p.strokeWeight(2);
//          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//          p.ellipse(pt.x, pt.y, r * 2, r * 2);
//        } else {
//          p.noStroke();
//          p.fill(isDimmed ? 
//            p.color(c.levels[0], c.levels[1], c.levels[2], 60) :
//            p.color(c.levels[0], c.levels[1], c.levels[2], 180));
//          p.ellipse(pt.x, pt.y, r * 2, r * 2);
//        }

//        this.points.push({
//          ...pt,
//          screenX: pt.x + this.margin.left,
//          screenY: pt.y + this.margin.top,
//          radius: r
//        });
//      }

//      p.pop();
//    },

//    drawLegendAndToggle(p) {
//      p.push();
//      const x0 = p.width - this.margin.right + 20;
//      const y0 = this.margin.top;

//      const { players } = this.getCurrentData();

//      // Gender Toggle Button at top of side panel
//      const toggleW = 140;
//      const toggleH = 35;
//      const toggleX = x0;
//      const toggleY = y0;
     
//      const isToggleHovering = p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//                               p.mouseY > toggleY && p.mouseY < toggleY + toggleH;
     
//      // Button styling
//      if (this.currentGender === "men") {
//        p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
//      } else {
//        p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
//      }
//      p.noStroke();
//      p.rect(toggleX, toggleY, toggleW, toggleH, 4);
     
//      p.fill(255);
//      p.textSize(12);
//      p.textAlign(p.CENTER, p.CENTER);
//      const toggleLabel = this.currentGender === "men" ? "MEN'S ATP ▼" : "WOMEN'S WTA ▼";
//      p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);
     
//      // Instruction text
//      p.fill(120);
//      p.textSize(9);
//      p.text("Click to switch", toggleX + toggleW / 2, toggleY + toggleH + 10);

//      // Legend section
//      const legendStartY = y0 + 60;
//      p.textAlign(p.LEFT, p.CENTER);
//      p.textSize(11);
//      p.noStroke();
//      p.fill(60);
//      p.text("Players (click to highlight)", x0, legendStartY);

//      let i = 1;
//      for (let name of players) {
//        const yy = legendStartY + i * 24;
//        const isHighlighted = this.highlightedPlayer === name;
//        const isClickable = p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
//                           p.mouseY > yy - 10 && p.mouseY < yy + 10;

//        if (isClickable) {
//          p.fill(230);
//          p.noStroke();
//          p.rect(x0 - 15, yy - 10, 150, 20, 3);
//        }

//        p.fill(this.colors[name]);
//        p.ellipse(x0 - 5, yy, 10, 10);
       
//        p.fill(isHighlighted ? 40 : 80);
//        p.textSize(11);
//        p.text(name, x0 + 8, yy);

//        if (isHighlighted) {
//          p.fill(40);
//          p.textSize(9);
//          p.text("★", x0 + 120, yy);
//        }

//        i++;
//      }

//      const infoY = legendStartY + i * 24 + 10;
//      p.textSize(10);
//      p.fill(100);
//      p.text("● = Slam year", x0, infoY);
//      p.text("▼ = Rank > 20", x0, infoY + 15);

//      if (this.highlightedPlayer) {
//        const resetY = infoY + 40;
//        const resetW = 100;
//        const resetH = 24;
//        const resetX = x0;
       
//        const isHovering = p.mouseX > resetX && p.mouseX < resetX + resetW &&
//                          p.mouseY > resetY && p.mouseY < resetY + resetH;
       
//        p.fill(isHovering ? 180 : 200);
//        p.stroke(140);
//        p.strokeWeight(1);
//        p.rect(resetX, resetY, resetW, resetH, 3);
       
//        p.noStroke();
//        p.fill(60);
//        p.textSize(10);
//        p.textAlign(p.CENTER, p.CENTER);
//        p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//      }

//      p.pop();
//    },

//    drawTooltip(p) {
//      let hovered = null;
//      for (let pt of this.points) {
//        const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//        if (d <= pt.radius + 6) {
//          hovered = pt;
//          break;
//        }
//      }
//      if (!hovered) return;

//      const lines = [];
//      lines.push(hovered.player);
//      lines.push("Year: " + hovered.year);

//      let rankLine = "Rank: " + hovered.rank;
//      if (hovered.isClipped) {
//        rankLine += " (worse than #20)";
//      }
//      lines.push(rankLine);

//      if (hovered.slams > 0) {
//        lines.push("Slams: " + hovered.slams);
//        if (hovered.slamNames) {
//          lines.push(hovered.slamNames);
//        }
//      } else {
//        lines.push("No Slams this year");
//      }

//      const padding = 8;
//      p.textSize(10);
//      let w = 0;
//      for (let t of lines) {
//        w = Math.max(w, p.textWidth(t));
//      }
//      const h = lines.length * 15;

//      let x = hovered.screenX + 15;
//      let y = hovered.screenY - h - 15;
//      if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//      if (y < 0) y = hovered.screenY + 15;

//      p.fill(255);
//      p.stroke(150);
//      p.strokeWeight(1);
//      p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//      p.noStroke();
//      p.fill(40);
//      p.textAlign(p.LEFT, p.TOP);
//      let ty = y + padding;
//      for (let i = 0; i < lines.length; i++) {
//        if (i === 0) {
//          p.textStyle(p.BOLD);
//        } else {
//          p.textStyle(p.NORMAL);
//        }
//        p.text(lines[i], x + padding, ty);
//        ty += 15;
//      }
//    },

//    handleClick(p) {
//      const x0 = p.width - this.margin.right + 20;
//      const y0 = this.margin.top;
     
//      // Check gender toggle click
//      const toggleW = 140;
//      const toggleH = 35;
//      const toggleX = x0;
//      const toggleY = y0;
     
//      if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//          p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
//        this.currentGender = this.currentGender === "men" ? "women" : "men";
//        this.highlightedPlayer = null;
//        this.computeRanges();
//        return true;
//      }

//      // Check legend clicks
//      const legendStartY = y0 + 60;
//      const { players } = this.getCurrentData();

//      for (let i = 0; i < players.length; i++) {
//        const name = players[i];
//        const yy = legendStartY + (i + 1) * 24;
       
//        if (p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
//            p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//          this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//          return true;
//        }
//      }

//      // Check reset button
//      if (this.highlightedPlayer) {
//        const infoY = legendStartY + (players.length + 1) * 24 + 10;
//        const resetY = infoY + 40;
//        const resetX = x0;
//        const resetW = 100;
//        const resetH = 24;
       
//        if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//            p.mouseY > resetY && p.mouseY < resetY + resetH) {
//          this.highlightedPlayer = null;
//          return true;
//        }
//      }

//      return false;
//    }
//  };

//  window.Viz_RQ2_RanksSlams = Viz;
// })();



// Viz_RQ2_RanksSlams.js
// Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
(function () {
 const Viz = {
   currentGender: "men",  // toggle between "men" and "women"
   menTable: null,
   womenTable: null,
   
   // Players for each gender - UPDATE THESE WITH YOUR ACTUAL PLAYERS
   menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
   womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],  // UPDATE
   
   colors: {},
   margin: { top: 60, right: 200, bottom: 60, left: 80 },
   chartW: 0,
   chartH: 0,
   yearMin: null,
   yearMax: null,
   rankMin: null,
   rankMax: null,
   points: [],
   initialized: false,
   RANK_CUTOFF: 20,
   highlightedPlayer: null,

   ensureInit(p) {
     if (this.initialized) return;
     this.chartW = p.width - this.margin.left - this.margin.right;
     this.chartH = p.height - this.margin.top - this.margin.bottom;

     // Colors for men (Big 3)
     this.colors["Roger Federer"]  = p.color(2, 131, 131);
     this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
     this.colors["Novak Djokovic"] = p.color(255, 228, 96);

     // Colors for women - UPDATE WITH YOUR ACTUAL PLAYER NAMES
     this.colors["Serena Williams"] = p.color(255, 105, 180);
     this.colors["Iga Swiatek"] = p.color(147, 51, 234);
     this.colors["Justine Henin"] = p.color(34, 197, 94);

     // Load both CSV files
     if (!this.menTable) {
       p.loadTable(
         "data/processed/rankings_slams.csv",
         "csv",
         "header",
         (t) => {
           this.menTable = t;
           console.log("Men's data loaded:", t.getRowCount(), "rows");
           this.computeRanges();
         },
         (err) => {
           console.error("Error loading men's data:", err);
         }
       );
     }
     
     if (!this.womenTable) {
       p.loadTable(
         "data/processed/rankings_slams_WTA.csv",
         "csv",
         "header",
         (t) => {
           this.womenTable = t;
           console.log("Women's data loaded:", t.getRowCount(), "rows");
           this.computeRanges();
         },
         (err) => {
           console.error("Error loading women's data:", err);
           console.error("Check file path: data/processed/ranks_slams_WTA.csv");
         }
       );
     }
     
     this.initialized = true;
   },

   getCurrentData() {
     return {
       table: this.currentGender === "men" ? this.menTable : this.womenTable,
       players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
     };
   },

   computeRanges() {
     const { table } = this.getCurrentData();
     if (!table || table.getRowCount() === 0) return;

     const years = [];
     for (let r = 0; r < table.getRowCount(); r++) {
       const yearVal = table.getString(r, "year");
       if (yearVal) years.push(parseInt(yearVal));
     }
     
     if (years.length > 0) {
       this.yearMin = Math.min(...years);
       this.yearMax = Math.max(...years);
     }

     this.rankMin = 1;
     this.rankMax = this.RANK_CUTOFF;
   },

   draw(p, manager, ai, progress) {
     this.ensureInit(p);
     
     const { table } = this.getCurrentData();
     
     // Debug: Check what's loaded
     if (!this.menTable) {
       p.background(240);
       p.fill(80);
       p.textAlign(p.CENTER, p.CENTER);
       p.noStroke();
       p.text("Loading men's data...", p.width / 2, p.height / 2);
       return;
     }
     
     if (!this.womenTable) {
       p.background(240);
       p.fill(80);
       p.textAlign(p.CENTER, p.CENTER);
       p.noStroke();
       p.text("Loading women's data...", p.width / 2, p.height / 2);
       console.log("Women's table not loaded yet");
       return;
     }
     
     if (!table || this.yearMin === null) {
       p.background(240);
       p.fill(80);
       p.textAlign(p.CENTER, p.CENTER);
       p.noStroke();
       const gender = this.currentGender === "men" ? "Men's" : "Women's";
       p.text(`${gender} data not ready...`, p.width / 2, p.height / 2);
       console.log(`Current gender: ${this.currentGender}, Table rows: ${table ? table.getRowCount() : 'null'}`);
       return;
     }

     p.background(240);
     this.points = [];

     this.drawAxes(p);

     const { players } = this.getCurrentData();
     for (let name of players) {
       this.drawPlayerLine(p, name);
     }

     this.drawLegendAndToggle(p);
     this.drawTooltip(p);
   },

   drawAxes(p) {
     p.push();
     p.translate(this.margin.left, this.margin.top);
     
     p.stroke(200);
     p.strokeWeight(1);

     // x-axis
     p.stroke(100);
     p.line(0, this.chartH, this.chartW, this.chartH);
     
     for (let y = this.yearMin; y <= this.yearMax; y += 2) {
       let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
       p.stroke(100);
       p.line(x, this.chartH, x, this.chartH + 5);
       
       p.textSize(10);
       p.noStroke();
       p.fill(80);
       p.textAlign(p.CENTER, p.CENTER);
       p.text(y, x, this.chartH + 20);
       
       p.stroke(220);
       p.line(x, 0, x, this.chartH);
     }

     // y-axis
     p.stroke(100);
     p.line(0, 0, 0, this.chartH);
     p.textAlign(p.RIGHT, p.CENTER);

     for (let r = this.rankMin; r <= this.rankMax; r += 5) {
       let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);
       p.stroke(100);
       p.line(-5, y, 0, y);
       
       p.noStroke();
       p.textSize(10);
       p.fill(80);
       p.text(r, -10, y);
       
       p.stroke(220);
       p.line(0, y, this.chartW, y);
     }

     // Axis labels
     p.noStroke();
     p.textAlign(p.CENTER);
     p.textSize(12);
     p.fill(60);
     p.text("Year", this.chartW / 2, this.chartH + 45);

     p.push();
     p.translate(-50, this.chartH / 2);
     p.rotate(-p.HALF_PI);
     const axisLabel = this.currentGender === "men" ? 
       "Year-end ATP Ranking (lower is better)" : 
       "Year-end WTA Ranking (lower is better)";
     p.text(axisLabel, 0, 0);
     p.pop();

     // Title
     p.textSize(16);
     p.fill(40);
     const titleLabel = this.currentGender === "men" ? 
       "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
       "WTA Year-end Rankings and Grand Slam Wins";
     p.text(titleLabel, this.chartW / 2, -30);

     p.pop();
   },

   drawPlayerLine(p, playerName) {
     const { table } = this.getCurrentData();
     
     const rows = [];
     for (let r = 0; r < table.getRowCount(); r++) {
       if (table.getString(r, "player_name") === playerName) {
         rows.push(table.getRow(r));
       }
     }

     rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

     const pts = [];
     for (let row of rows) {
       const year = parseInt(row.get("year"));
       const rankStr = row.get("rank");
       const trueRank = parseInt(rankStr);
       if (Number.isNaN(trueRank)) continue;

       const slamsStr = row.get("slam_wins");
       const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
       const slamNames = row.get("slam_names") || "";

       const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

       const isClipped = trueRank > this.rankMax;
       const rankForPlot = isClipped ? this.rankMax : trueRank;
       const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

       pts.push({
         x, y, year,
         rank: trueRank,
         slams,
         slamNames,
         player: playerName,
         isClipped
       });
     }

     p.push();
     p.translate(this.margin.left, this.margin.top);

     const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
     const c = this.colors[playerName];

     // Ranking line
     if (isDimmed) {
       p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
       p.strokeWeight(1);
     } else {
       p.stroke(c);
       p.strokeWeight(2.5);
     }
     
     p.noFill();
     p.beginShape();
     for (let pt of pts) {
       p.vertex(pt.x, pt.y);
     }
     p.endShape();

     // Draw points
     for (let pt of pts) {
       const baseRadius = pt.slams > 0 ? 5 : 2;
       const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
       const r = baseRadius + extra;

       if (pt.isClipped) {
         const bottomY = this.chartH;
         const triSize = 6;
         p.noStroke();
         p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
         p.triangle(
           pt.x, bottomY + triSize,
           pt.x - triSize / 2, bottomY,
           pt.x + triSize / 2, bottomY
         );
       } else if (pt.slams > 0) {
         if (!isDimmed) {
           p.noStroke();
           p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
           p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
         }

         p.stroke(255);
         p.strokeWeight(2);
         p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
         p.ellipse(pt.x, pt.y, r * 2, r * 2);
       } else {
         p.noStroke();
         p.fill(isDimmed ? 
           p.color(c.levels[0], c.levels[1], c.levels[2], 60) :
           p.color(c.levels[0], c.levels[1], c.levels[2], 180));
         p.ellipse(pt.x, pt.y, r * 2, r * 2);
       }

       this.points.push({
         ...pt,
         screenX: pt.x + this.margin.left,
         screenY: pt.y + this.margin.top,
         radius: r
       });
     }

     p.pop();
   },

   drawLegendAndToggle(p) {
     p.push();
     const x0 = p.width - this.margin.right + 20;
     const y0 = this.margin.top;

     const { players } = this.getCurrentData();

     // Gender Toggle Button at top of side panel
     const toggleW = 140;
     const toggleH = 35;
     const toggleX = x0;
     const toggleY = y0;
     
     const isToggleHovering = p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
                              p.mouseY > toggleY && p.mouseY < toggleY + toggleH;
     
     // Button styling
     if (this.currentGender === "men") {
       p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
     } else {
       p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
     }
     p.noStroke();
     p.rect(toggleX, toggleY, toggleW, toggleH, 4);
     
     p.fill(255);
     p.textSize(12);
     p.textAlign(p.CENTER, p.CENTER);
     const toggleLabel = this.currentGender === "men" ? "MEN'S ATP ▼" : "WOMEN'S WTA ▼";
     p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);
     
     // Instruction text
     p.fill(120);
     p.textSize(9);
     p.text("Click to switch", toggleX + toggleW / 2, toggleY + toggleH + 10);

     // Legend section
     const legendStartY = y0 + 60;
     p.textAlign(p.LEFT, p.CENTER);
     p.textSize(11);
     p.noStroke();
     p.fill(60);
     p.text("Players (click to highlight)", x0, legendStartY);

     let i = 1;
     for (let name of players) {
       const yy = legendStartY + i * 24;
       const isHighlighted = this.highlightedPlayer === name;
       const isClickable = p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
                          p.mouseY > yy - 10 && p.mouseY < yy + 10;

       if (isClickable) {
         p.fill(230);
         p.noStroke();
         p.rect(x0 - 15, yy - 10, 150, 20, 3);
       }

       p.fill(this.colors[name]);
       p.ellipse(x0 - 5, yy, 10, 10);
       
       p.fill(isHighlighted ? 40 : 80);
       p.textSize(11);
       p.text(name, x0 + 8, yy);

       if (isHighlighted) {
         p.fill(40);
         p.textSize(9);
         p.text("★", x0 + 120, yy);
       }

       i++;
     }

     const infoY = legendStartY + i * 24 + 10;
     p.textSize(10);
     p.fill(100);
     p.text("● = Slam year", x0, infoY);
     p.text("▼ = Rank > 20", x0, infoY + 15);

     if (this.highlightedPlayer) {
       const resetY = infoY + 40;
       const resetW = 100;
       const resetH = 24;
       const resetX = x0;
       
       const isHovering = p.mouseX > resetX && p.mouseX < resetX + resetW &&
                         p.mouseY > resetY && p.mouseY < resetY + resetH;
       
       p.fill(isHovering ? 180 : 200);
       p.stroke(140);
       p.strokeWeight(1);
       p.rect(resetX, resetY, resetW, resetH, 3);
       
       p.noStroke();
       p.fill(60);
       p.textSize(10);
       p.textAlign(p.CENTER, p.CENTER);
       p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
     }

     p.pop();
   },

   drawTooltip(p) {
     let hovered = null;
     for (let pt of this.points) {
       const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
       if (d <= pt.radius + 6) {
         hovered = pt;
         break;
       }
     }
     if (!hovered) return;

     const lines = [];
     lines.push(hovered.player);
     lines.push("Year: " + hovered.year);

     let rankLine = "Rank: " + hovered.rank;
     if (hovered.isClipped) {
       rankLine += " (worse than #20)";
     }
     lines.push(rankLine);

     if (hovered.slams > 0) {
       lines.push("Slams: " + hovered.slams);
       if (hovered.slamNames) {
         lines.push(hovered.slamNames);
       }
     } else {
       lines.push("No Slams this year");
     }

     const padding = 8;
     p.textSize(10);
     let w = 0;
     for (let t of lines) {
       w = Math.max(w, p.textWidth(t));
     }
     const h = lines.length * 15;

     let x = hovered.screenX + 15;
     let y = hovered.screenY - h - 15;
     if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
     if (y < 0) y = hovered.screenY + 15;

     p.fill(255);
     p.stroke(150);
     p.strokeWeight(1);
     p.rect(x, y, w + padding * 2, h + padding * 2, 4);

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

   handleClick(p) {
     const x0 = p.width - this.margin.right + 20;
     const y0 = this.margin.top;
     
     // Check gender toggle click
     const toggleW = 140;
     const toggleH = 35;
     const toggleX = x0;
     const toggleY = y0;
     
     if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
         p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
       this.currentGender = this.currentGender === "men" ? "women" : "men";
       this.highlightedPlayer = null;
       this.computeRanges();
       return true;
     }

     // Check legend clicks
     const legendStartY = y0 + 60;
     const { players } = this.getCurrentData();

     for (let i = 0; i < players.length; i++) {
       const name = players[i];
       const yy = legendStartY + (i + 1) * 24;
       
       if (p.mouseX > x0 - 15 && p.mouseX < x0 + 140 &&
           p.mouseY > yy - 10 && p.mouseY < yy + 10) {
         this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
         return true;
       }
     }

     // Check reset button
     if (this.highlightedPlayer) {
       const infoY = legendStartY + (players.length + 1) * 24 + 10;
       const resetY = infoY + 40;
       const resetX = x0;
       const resetW = 100;
       const resetH = 24;
       
       if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
           p.mouseY > resetY && p.mouseY < resetY + resetH) {
         this.highlightedPlayer = null;
         return true;
       }
     }

     return false;
   }
 };

 window.Viz_RQ2_RanksSlams = Viz;
})();